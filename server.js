const express = require("express");
const app = express();
const db = require("./db");
const { compare, hash } = require("./bc");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

let sessionSecret;

if (process.env.NODE_ENV == "production") {
    sessionSecret = process.env.SESSION_SECRET;
} else {
    sessionSecret = require("./secrets.json").SESSION_SECRET;
}

const {
    requireLoggedInUser,
    requireSignature,
    requireNoSignature,
    requireLoggedOutUser,
} = require("./middlewares");
//////////////////////////////////////////////////////////////////////////
//////////////////////////     MIDDELWARE      ///////////////////////////
//////////////////////////////////////////////////////////////////////////
app.use(express.urlencoded({ extended: false }));
app.use(
    cookieSession({
        secret: `${sessionSecret}`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

app.use(express.static("./puplic"));
app.use(requireLoggedInUser);
//////////////////////////////////////////////////////////////////////////
//////////////////////////     ROUTES      ///////////////////////////////
//////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/petiton");
        return;
    } else {
        res.redirect("/register");
        return;
    }
});

//-------------------------------------------------------------
app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        layout: "main",
    });
});
app.post("/register", requireLoggedOutUser, (req, res) => {
    const { first, last, email, password } = req.body;

    hash(password)
        .then((hashedPass) => {
            db.register(first, last, email, hashedPass)
                .then(({ rows }) => {
                    req.session.userId = rows[0].id;

                    res.redirect("/profile");
                    return;
                })

                .catch((err) => {
                    console.log("error in POST /register in db.register", err);
                    res.render("register");
                });
        })
        .catch((err) => {
            console.log("error in  hash", err);
            res.render("register", {
                layout: "main",
                errorSignUp: "please sign up",
            });
        });
});
//-------------------------------------------------------------

app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login", {
        layout: "main",
    });
});
app.post("/login", requireLoggedOutUser, (req, res) => {
    const { email, password } = req.body;
    hash(password).then((hashedPw) => {
        console.log("hasedPw:  ", hashedPw);
        db.getUserByEmail(email)
            .then(({ rows }) => {
                console.log("Data from getU: ", rows);
                compare(password, rows[0].hashed_password)
                    .then((checkPw) => {
                        console.log("data from get userByeEmail: ", rows);
                        if (checkPw === true) {
                            req.session.userId = rows[0].userid;
                            req.session.sigId = rows[0].sigid;

                            if (req.session.sigId) {
                                res.redirect("/thanks");
                                return;
                            } else {
                                res.redirect("/petition");
                                return;
                            }
                        } else {
                            res.render("login", {
                                error: "Please use a vaild password",
                            });
                        }
                    })
                    .catch((err) => {
                        console.log("error in compare:", err);
                    });
            })
            .catch((err) => {
                console.log("err in hash:", err);
                res.render("login", {
                    error: "Please use a vaild email",
                });
            });
    });
});

//-------------------------------------------------------------

app.get("/profile", requireNoSignature, (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", requireNoSignature, (req, res) => {
    const { age, city, homepage } = req.body;
    const userId = req.session.userId;
    console.log(("req.session", req.session));
    if (req.body.homepage && !req.body.homepage.startsWith("http")) {
        return res.render("profile", {
            layout: "main",
            error: "Your homepage should start with 'https://'. Please try again.",
        });
    }
    let ageInt = parseInt(age);
    if (isNaN(ageInt)) {
        ageInt = null;
    }

    db.addProfile(age, city, homepage, userId)
        .then(() => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("erro in POST profile: ", err);
            res.render("profile", {
                error: "Please try again!",
            });
        });
});
//-------------------------------------------------------------

app.get("/edit", (req, res) => {
    const userId = req.session.userId;
    db.getUser(userId).then(() => {
        res.render("edit", {
            first: req.session.first,
            last: req.session.last,
        });
    });
});
app.post("/edit", (req, res) => {
    if (req.body.homepage && !req.body.homepage.startsWith("http")) {
        return res.render("edit", {
            layout: "main",
            error: "Your homepage should start with 'https://'. Please try again.",
        });
    }
    let ageInt = parseInt(req.body.age);
    if (isNaN(ageInt)) {
        ageInt = null;
    }
    if (req.body.password != "") {
        hash(req.body.password).then((hashed) => {
            // console.log("body: ", req.body);
            db.edit_usersTable(
                req.body.first,
                req.body.last,
                req.body.email,
                hashed,
                req.session.userId
            )
                .then(() => {
                    res.redirect("/petition");
                    return;
                })
                .catch((err) => {
                    console.log("err: ", err);
                    res.render("petition", {
                        error: true,
                    });
                });
        });
    } else {
        db.update_useresTableWithoutPW(
            req.body.first,
            req.body.last,
            req.body.email,
            req.session.userId
        ).catch((err) => {
            console.log("error: ", err);
            res.render("edit", {
                error: true,
            });
        });
    }
    db.edit_profilesTable(
        req.body.age,
        req.body.city,
        req.body.homepage,
        req.session.userId
    )
        .then(() => {
            res.redirect("/petition");
            return;
        })
        .catch((err) => {
            console.log("error: ", err);
            res.render("petition", {
                error: true,
            });
        });
});

//-------------------------------------------------------------

app.get("/thanks", requireSignature, (req, res) => {
    console.log("get req to /thanks happend");
    if (req.session.sigId) {
        db.getSigners()
            .then(({ rows }) => {
                db.findSignature(req.session.userId).then((result) => {
                    let sigImg = result.rows[0].signature;

                    res.render("thanks", {
                        layout: "main",
                        countSigners: rows.length,
                        signature: sigImg,
                    });
                });
            })
            .catch((err) => console.log("err in GET /thanks:", err));
    } else {
        res.redirect("/petition");
        return;
    }
});

app.post("/thanks", (req, res) => {
    const { deleteSignature, editProfile } = req.body;
    if (deleteSignature === "") {
        db.deleteSignature(req.session.userId)
            .then(() => {
                req.session.sigId = null;
                res.redirect("/petition");
                return;
            })
            .catch((err) => {
                console.log("error in deleteSignature", err);
                res.render("thanks", {
                    layout: "main",
                });
            });
    } else if (editProfile === "") {
        res.redirect("/edit");
        return;
    }
});

//-------------------------------------------------------------

app.get("/petition", requireNoSignature, (req, res) => {
    console.log("get req to /petition happend");
    res.render("petition", {
        layout: "main",
    });
});
app.post("/petition", requireNoSignature, (req, res) => {
    db.addSigner(req.session.userId, req.body.hiddenInput)
        .then(({ rows }) => {
            req.session.sigId = rows[0].id;
            res.redirect("/thanks");
            return;
        })
        .catch((err) => {
            res.render("petition", {
                error: "please sign in",
            });
            console.log("err in POST /petition: ", err);
        });
});

//-------------------------------------------------------------

app.get("/signers", requireSignature, (req, res) => {
    console.log("get req to /signers happend");
    if (req.session.sigId) {
        db.getSigners()
            .then(({ rows }) => {
                console.log("rows: ", rows);
                res.render("signers", {
                    layout: "main",
                    signers: rows,
                });
            })
            .catch((err) => console.log("err in GET /signers:", err));
    } else {
        res.redirect("/petition");
        return;
    }
});

app.get("/signers/:city", requireSignature, (req, res) => {
    const { city } = req.params;
    console.log("city: ", city);
    db.getUsersByCity(city)
        .then(({ rows }) => {
            res.render("city", {
                layout: "main",
                city: city,
                rows,
            });
        })
        .catch((err) => {
            console.log("err in signers:city: ", err);
        });
});

//-------------------------------------------------------------

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
    return;
});

//-------------------------------------------------------------

app.listen(process.env.PORT || 8080, () => {
    console.log("server listning on port 8080");
});

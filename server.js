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
//////////////////////////////////////////////////////////////////////////
//////////////////////////     GET ROUTES      ///////////////////////////
//////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/login");
    } else {
        res.redirect("/register");
    }
});

app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});
app.get("/edit", (req, res) => {
    db.getUser(req.session.userId)
        .then(({ rows }) => {
            res.render("edit", {
                layout: "main",
                rows,
            });
        })
        .catch((err) => {
            console.log("error in db.getUser", err);
            res.render("edit", {
                message: true,
            });
        });
});

app.get("/petition", (req, res) => {
    console.log("get req to /petition happend");
    res.render("petition", {
        layout: "main",
    });
});

app.get("/thanks", (req, res) => {
    console.log("get req to /thanks happend");
    if (req.session.sigId) {
        db.getSigners()
            .then(({ rows }) => {
                res.render("thanks", {
                    layout: "main",
                    countSigners: rows.length,
                    signature: rows[rows.length - 1].signature,
                });
            })
            .catch((err) => console.log("err in GET /thanks:", err));
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
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
    }
});

app.get("/signers/:city", (req, res) => {
    const { city } = req.params;
    db.getUsersByCity(city)
        .then(({ rows }) => {
            res.render("city", {
                layout: "main",
                city: "city",
                rows,
            });
        })
        .catch((err) => {
            console.log("err in signers:city: ", err);
        });
});
////  "/logout" routs to clear the cookie///
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});
//////////////////////////////////////////////////////////////////////////
//////////////////////////     POST ROUTES      //////////////////////////
//////////////////////////////////////////////////////////////////////////
app.post("/register", (req, res) => {
    const { first, last, email, password } = req.body;

    hash(password)
        .then((hashedPass) => {
            db.register(first, last, email, hashedPass)
                .then(({ rows }) => {
                    req.session.userId = rows[0].id;
                    // res.redirect("/petition");
                    res.redirect("/profile");
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
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log("were getting email info", email);
    db.getUserByEmail(email).then(({ rows }) => {
        if (rows.length === 0) {
            console.log("login143");
            res.render("login", {
                layout: "main",
                errorNoUser: "no user found",
            });
            return;
        }
        compare(password, rows[0].hashed_password).then((chechPw) => {
            if (chechPw === true) {
                req.session.id = rows[0].id;
                res.redirect("/petition");
            } else {
                console.log("login155");

                res.render("login", {
                    layout: "main",
                    wrongPassword: "wrong password",
                });
            }
        });
    });
});

app.post("/profile", (req, res) => {
    const { age, city, homepage } = req.body;
    const userId = req.session.userId;
    console.log(("req.session", req.session));
    // if (homepage.startsWith("http://")) {
    //     return homepage;
    // } else {
    //     return null;
    // }
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

app.post("/edit", (req, res) => {
    const { first, last, email, password, age, city, homepage } = req.body;
});

app.post("/petition", (req, res) => {
    db.addSigner(req.session.userId, req.body.hiddenInput)
        .then(({ rows }) => {
            req.session.sigId = rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            res.render("petition", {
                error: "please sign in",
            });
            console.log("err in POST /petition: ", err);
        });
});

app.listen(process.env.PORT || 8080, () => {
    console.log("server listning on port 8080");
});

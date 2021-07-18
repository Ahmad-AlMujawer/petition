const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//////////////////////////////////////////////////////////////////////////
//////////////////////////     MIDDELWARE      ///////////////////////////
//////////////////////////////////////////////////////////////////////////
app.use(express.urlencoded({ extended: false }));
app.use(
    cookieSession({
        secret: `cookieSession`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(express.static("./puplic"));
//////////////////////////////////////////////////////////////////////////
//////////////////////////     ROUTES      ///////////////////////////////
//////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    if (req.session.sigId) {
        res.redirect("/thanks");
    } else {
        res.redirect("/petition");
    }
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
////  "/logout" routs to clear the cookie///
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition");
});
///////////////////////POST ROUTS///////////////////////////
app.post("/petition", (req, res) => {
    db.addSigner(req.body.first, req.body.last, req.body.hiddenInput)
        .then((results) => {
            req.session.sigId = results.rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            res.render("petition", {
                layout: "main",
                error: "please sign in",
            });
            console.log("err in POST /petition: ", err);
        });
});

app.listen(8080, () => {
    console.log("server listning on port 8080");
});

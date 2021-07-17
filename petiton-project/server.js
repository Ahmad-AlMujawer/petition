const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//////////////////////////////////////////////////////////////////////////
//////////////////////////     MIDDELWARE      ///////////////////////////
//////////////////////////////////////////////////////////////////////////
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use((req, res, next) => {
//     console.log("my middleware is running");
//     console.log("req.url", req.url);
//     next()
// });

app.use(express.static("./puplic"));
//////////////////////////////////////////////////////////////////////////
//////////////////////////     ROUTES      ///////////////////////////////
//////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    console.log("get req to /petition happend");
    // console.log("cookies in /petition", req.cookies);
    db.getSigners()
        .then((results) => {
            if (results.rows.length == 0) {
                res.render("petition", {
                    layout: "main",
                });
            } else {
                res.redirect("thanks");
            }
        })
        .catch((err) => {
            console.log("err in GET petition: ", err);
        });
});

app.get("/thanks", (req, res) => {
    console.log("get req to /thanks happend");
    res.render("thanks", {
        layout: "main",
    });
});

app.get("/signers", (req, res) => {
    console.log("get req to /signers happend");
    res.render("signers", {
        layout: null,
    });
});

app.post("/petition", (req, res) => {
    if (req.body == "") {
        res.render("/petition", {
            layout: "main",
        });
    } else {
        db.addSigner()
            .then(() => {
                //add cookie
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("err in POST petition: ", err);
            });
    }
});

app.listen(8080, () => {
    console.log("server listning on port 8080");
});

const router = require('express').Router();
const db = require("../app").db;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* AGGREGATE FUNCTIONS */

router.get("/", (req, res) => {
    db.query(`SELECT r.id, r.name, r.cuisine, AVG(rw.score) AS avg_score FROM restaurants r 
        LEFT JOIN reviews rw ON r.id = rw.restaurant_id  GROUP BY r.name HAVING avg_score > 0 ORDER BY avg_score DESC LIMIT 10 ; 
        SELECT DISTINCT cuisine from restaurants`, (err, data) => {
        res.render("index", {
            avg: data[0],
            cuisine: data[1],
            user: req.user
        });
        res.status(200);
    });
});

/* ROUTES */

router.get("/login", (req, res) => {
    res.render("login", {user: req.user});
});


router.get("/register", (req, res) => {
    res.render("register", {user: req.user});
});

router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

/* LOGIN */

router.post("/login", (req, res) => {
    db.query(`SELECT * FROM users WHERE email = ?`, [req.body.email], (err, user) => { // checks if email exists in db
        console.log(user);
        if (!user.length) {
            console.log("user not found")
            req.flash("error", "Username not found.");
            res.render("login", {user: req.user});
        } else {
            bcrypt.compare(req.body.password, user[0].password, (err, result) => { // compares pw to hashed pw in db
                if (result) {
                    console.log(user[0]);
                    jwt.sign(user[0], process.env.SECRET, (err, token) => { // creates token
                        if (err) {
                            console.log("error...");
                            console.error(err);
                        } else {
                            res.cookie("token", token); // token to cookie
                            res.redirect("/");
                        }
                    });
                } else {
                    console.log("Wrong password.");
                    req.flash("error", "Wrong password.");
                    res.render("login", {user: req.user});
                }
            });
        }
    });
});

/* REGISTER */

router.post("/register", (req, res) => {
    db.query(`SELECT * FROM users WHERE email = ?`, [req.body.email], (err, result) => { // checks if email already exists in db
        if (!result.length) {
            bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                console.log(hashedPassword);
                db.query(`INSERT into users (email, username, password) VALUES (?, ?, ?)`, [req.body.email, req.body.username, hashedPassword], (err, user) => { // adds user to db
                    if (err) throw err;
                    console.log(user);
                    res.status(200);
                    res.redirect("/login");
                });
            });
        } else {
            console.log("User exists already");
            req.flash("errorRegister", "User already exists.");
            res.render("register", {user: req.user});
        }
    });

});

module.exports = router;
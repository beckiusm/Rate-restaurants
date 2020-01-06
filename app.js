"use strict";
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const session = require("express-session");
const accesscontrol = require("accesscontrol");
const favicon = require("express-favicon");
require('dotenv').config({
    path: __dirname + '/.env'
});
app.listen(process.env.PORT, () => console.log(`Hello world app listening on port ${process.env.PORT}!`));
const mariadb = require('mariadb/callback');

/* DATABASE CONNECTION */

const db = mariadb.createPool({
    host: process.env.DB,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    multipleStatements: true
});

/* MIDDLEWARE */

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static('public'));
app.use("/rating", express.static("node_modules/jquery.rateit/scripts"));
app.use(favicon(__dirname + "/public/images/star.png"));

/* ACCESS CONTROL */

const ac = new accesscontrol();
ac.grant("none");
ac.grant("user")
    .createOwn("review")
    .grant("admin")
    .extend("user")
    .createAny("restaurant")
    .deleteAny("restaurant")
    .updateAny("restaurant");

/* VIEW ENGINE */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* ROUTES */

app.get("/rating", (req, res) => {
    res.sendFile(__dirname + "/node_modules/jquery.rateit/scripts");
});

app.get("/randomImage/:cuisine", (req, res) => { // returns random image of cuisine
    let files = fs.readdirSync(path.join(__dirname, "public/images/" + req.params.cuisine));
    let randomImage = files[Math.floor(Math.random() * files.length)];
    res.sendFile(__dirname+`/public/images/${req.params.cuisine}/${randomImage}`);
});

app.get("/", (req, res) => {
    db.query(`SELECT r.id, r.name, r.cuisine, AVG(rw.score) AS avg_score FROM restaurants r 
        LEFT JOIN reviews rw ON r.id = rw.restaurant_id  GROUP BY r.name HAVING avg_score > 0 ORDER BY avg_score DESC LIMIT 10 ; 
        SELECT DISTINCT cuisine from restaurants`, (err, data) => {
        res.render("index", {
            avg: data[0],
            cuisine: data[1]
        });
        res.status(200);
    });
});

app.get("/admin", (req, res) => {
    jwt.verify(req.cookies.token, process.env.SECRET, (err, decoded) => { // check if token is valid
        if (decoded) {
            req.user = decoded.user;
        } else {
            req.user = {
                role: "none"
            }
        }
        let permission = ac.can(req.user.role).createAny("restaurant").granted;
        if (permission) {
            res.render("addrestaurant");
        } else {
            req.flash("error", "You're not an admin");
            res.render("addrestaurant")
        }
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/review", (req, res) => {
    res.render("partials/review");
});

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

app.get("/hejsan", (req, res) => { // testing
    db.query("SELECT r.id, r.name, r.address, r.zipcode, r.street_number, r.borough, r.cuisine, rw.text FROM restaurants r LEFT JOIN reviews rw ON rw.text IS NOT NULL AND r.id = rw.restaurant_id WHERE r.id = ?; select avg(score) from reviews where restaurant_id = 4507", ["4507"], (err, result) => {
        console.log(result);
        res.json(result);
    })
})

app.get("/restaurants/:id?", (req, res) => {
    jwt.verify(req.cookies.token, process.env.SECRET, (err, decoded) => { // check if token is valid
        if (decoded) {
            req.user = decoded.user;
        } else {
            req.user = {
                role: "none"
            }
        }
    });
    console.log(req.user);
    let permission = ac.can(req.user.role).createOwn("review").granted;
    if (req.query.cuisine) { // cuisine paramter
        db.query("SELECT * FROM restaurants WHERE cuisine = ?", [req.query.cuisine], (err, data) => {
            res.render("restaurants", {
                data
            });
            res.status(200);
        });
    } else if (!req.params.id) { // no parameters
        db.query("SELECT * FROM restaurants LIMIT 300", (err, data) => {
            res.render("restaurants", {
                data
            });
            res.status(200);
        });
    } else { // with id paraeter
        db.query(`SELECT r.id, r.name, r.address, r.zipcode, r.street_number, r.borough, r.cuisine, rw.text, rw.score as score, 
                (select avg(score) from reviews where restaurant_id = ?) as avg_score FROM restaurants r LEFT JOIN reviews rw ON r.id = rw.restaurant_id WHERE r.id = ?`, [req.params.id, req.params.id], (err, restaurant) => {
            res.render("restaurant.ejs", {
                restaurant,
                permission
            });
        });
    }
});

/* POST REQUESTS */

app.post("/addRestaurant", (req, res) => {
    db.query(`INSERT into restaurants (name, address, street_number, zipcode, borough, cuisine) 
    VALUES (?, ?, ?, ?, ?, ?)`, [req.body.name, req.body.address, req.body.street_number, req.body.zipcode, req.body.borough, req.body.cuisine], (err, result) => { // add restaurant to db
        if (err) throw err;
        console.log(result);
        res.status(200);
        res.redirect("/");
    });
});

app.post("/addReview", (req, res) => {
    console.log(req.body);
    db.query("INSERT into reviews (restaurant_id, score, text) VALUES (?, ?, ?)",
        [req.body.id, req.body.score, req.body.review], (err, result) => { // add review to db
            if (err) throw err;
            console.log(result);
            res.status(200);
            res.redirect("back");
        });
});

/* --- LOGIN/REGISTER */

app.post("/register", (req, res) => {
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
            res.render("register");
        }
    });

});

app.post("/login", (req, res) => {
    db.query(`SELECT * FROM users WHERE email = ?`, [req.body.email], (err, user) => { // checks if email exists in db
        if (!user.length) {
            console.log("user not found")
            req.flash("error", "Username not found.");
            res.render("login");
        } else {
            bcrypt.compare(req.body.password, user[0].password, (err, result) => { // compares pw to hashed pw in db
                if (result) {
                    console.log(user[0]);
                    jwt.sign({
                        user: user[0]
                    }, process.env.SECRET, (err, token) => { // creates token
                        if (err) {
                            console.log("error...");
                            console.error(err);
                        } else {
                            req.user = user;
                            res.cookie("token", token); // token to cookie
                            res.redirect("/");
                        }
                    });
                } else {
                    console.log("Wrong password.");
                    req.flash("error", "Wrong password.");
                    res.render("login");
                }
            });
        }
    });
});
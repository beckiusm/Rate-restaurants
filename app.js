"use strict";
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const session = require("express-session");
require('dotenv').config({path: __dirname + '/.env'});
app.listen(process.env.PORT, () => console.log(`Hello world app listening on port ${process.env.PORT}!`));
const mariadb = require('mariadb/callback');

/* DATABASE CONNECTION */

const db = mariadb.createConnection({
    host: process.env.DB, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use("/rating", express.static("node_modules/jquery.rateit/scripts"));

/* VIEW ENGINE */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* ROUTES */

app.get("/rating", (req, res) => {
    res.sendFile(__dirname + "/node_modules/jquery.rateit/scripts");
});

app.get("/", (req, res) => {
    jwt.verify(req.cookies.token, process.env.SECRET, (err, decoded) => { // check if token is valid
        if (err) return res.redirect("/login");
        db.query("SELECT * FROM restaurants LIMIT 300", (err, data) => {
            res.render("restaurants", {data});
            res.status(200);
        });
    });
    
});

app.get("/admin", (req, res) => {
    res.render("addrestaurant");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/review", (req, res) => {
    res.render("partials/review");
})

/* POST REQUESTS */

app.post("/addRestaurant", (req, res) => {
    db.query(`INSERT into restaurants (name, address, zipcode, street_number, borough, cuisine) 
    VALUES (?, ?, ?, ?, ?, ?`, [req.body.name, req.body.address, req.body.street_number, req.body.zipcode, req.body.borough, req.body.cuisine], (err, result) => { // add restaurant to db
        if (err) throw err;
        console.log(result);
        res.status(200);
        res.redirect("/");
    });
});

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
                    jwt.sign({user: user[0].username}, process.env.SECRET, (err, token) => { // creates token
                        if (err) {
                            console.log("error...");
                            console.error(err);
                        } else {
                            console.log(token);
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
"use strict";
const app = require('express')();
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

/* VIEW ENGINE */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* ROUTES */

app.get("/", (req, res) => {
    jwt.verify(req.cookies.token, process.env.SECRET, (err, decoded) => {
        if (err) return res.redirect("/login");
        db.query("SELECT * FROM restaurants LIMIT 5", (err, data) => {
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

/* POST REQUESTS */

app.post("/addRestaurant", (req, res) => {
    db.query(`INSERT into restaurants (name, address, zipcode, street_number, borough, cuisine) 
    VALUES ("${req.body.name}", "${req.body.address}", "${req.body.street_number}", "${req.body.zipcode}", "${req.body.borough}", "${req.body.cuisine}")`, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.status(200);
        res.redirect("/");
    });
});

app.post("/addUser", (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
        console.log(hashedPassword);
        db.query(`INSERT into users (email, username, password) VALUES ("${req.body.email}", "${req.body.username}", "${hashedPassword}")`, (err, result) => {
            if (err) throw err;
            console.log(result);
            res.status(200);
            res.redirect("/login");
        });
    });
});

app.post("/loginUser", (req, res) => {
    db.query(`SELECT * FROM users WHERE email="${req.body.email}"`, (err, user) => {
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
            if (result) {
                jwt.sign({user: user[0].username}, process.env.SECRET, (err, token) => {
                    if (err) {
                        console.log("error...");
                        console.error(err);
                    } else {
                        console.log(token);
                        res.cookie("token", token);
                        res.redirect("/");
                    }
                });
                
            } else {
                console.log("FEL PW");
                res.redirect("/login");
            }
        });
    });
});
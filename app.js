"use strict";
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const exjwt = require("express-jwt");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const session = require("express-session");
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

exports.db = db;

/* ROUTERS */

const restaurantRouter = require('./routes/restaurants');
const apiRouter = require('./routes/api');
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

/* RATING */

app.get("/rating", (req, res) => {
    res.sendFile(__dirname + "/node_modules/jquery.rateit/scripts");
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
app.use(favicon(__dirname + "/public/images/star.png"));
app.use(exjwt({
    secret: process.env.SECRET,
    credentialsRequired: false,
    getToken: (req) => {
        return req.cookies.token;
    }
}));
app.use("/rating", express.static("node_modules/jquery.rateit/scripts"));
app.use("/api", apiRouter);
app.use("/admin", adminRouter);
app.use("/restaurants", restaurantRouter);
app.use("/", indexRouter);

/* VIEW ENGINE */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const router = require('express').Router();
const db = require("../app").db;
const fs = require("fs");
const path = require("path"),
    __parentDir = path.dirname(module.parent.filename);

/* RESTAURANTS */

/* GET REQUESTS */

router.get("/restaurants/cuisine/:cuisine", (req, res) => {
    db.query("SELECT * FROM restaurants WHERE cuisine = ?", [req.params.cuisine], (err, data) => {
        if (err) {
            res.send(err).status(404);
        } else {
            res.json(data).status(200);
        }
    });
});

router.get("/restaurants/:id?", (req, res) => {
    if (!req.params.id) { // no parameters
        db.query("SELECT * FROM restaurants", (err, data) => {
            if (err) {
                res.send(err).status(404);
            } else {
                res.json(data).status(200);
            }
        });
    } else { // with id paraeter
        db.query(`SELECT r.id, r.name, r.address, r.zipcode, r.street_number, r.borough, r.cuisine, rw.text, rw.score as score, 
        (select avg(score) from reviews where restaurant_id = ?) as avg_score FROM restaurants r LEFT JOIN reviews rw ON r.id = rw.restaurant_id WHERE r.id = ?`, [req.params.id, req.params.id], (err, restaurant) => {
            if (err) {
                res.send(err).status(404);
            } else {
                res.json(restaurant).status(200);
            }
        });
    }
});

/* POST REQUESTS */

router.post("/addRestaurant", (req, res) => {
    db.query(`INSERT into restaurants (name, address, street_number, zipcode, borough, cuisine) 
    VALUES (?, ?, ?, ?, ?, ?)`, [req.body.name, req.body.address, req.body.street_number, req.body.zipcode, req.body.borough, req.body.cuisine], (err, result) => { // add restaurant to db
        if (err) throw err;
        console.log(result);
        res.status(201).json(result);
    });
});

router.post("/addReview", (req, res) => {
    console.log(req.body);
    db.query("INSERT into reviews (restaurant_id, score, text) VALUES (?, ?, ?)",
        [req.body.id, req.body.score, req.body.review], (err, result) => { // add review to db
            if (err) throw err;
            console.log(result);
            res.status(200);
            res.redirect("back");
        });
});

/* UPDATE REQUESTS */

router.patch("/updateRestaurant/:id", (req, res) => {
    db.query(`UPDATE restaurants SET name=?, address=?, street_number=?, zipcode=?, borough=?, cuisine=? WHERE id=?`, 
    [req.body.name, req.body.address, req.body.street_number, req.body.zipcode, req.body.borough, req.body.cuisine, req.params.id], (err, result) => { // add restaurant to db
        if (err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
})

/* DELETE REQUESTS */

router.delete("/deleteRestaurant/:id", (req, res) => {
    db.query(`DELETE FROM restaurants WHERE id=?`, [req.params.id], (err, result) => { // add restaurant to db
        if (err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
})

/* RANDOM IMAGE */

router.get("/randomImage/:cuisine", (req, res) => { // returns random image of cuisine
    let files = fs.readdirSync(path.join(__parentDir, "public/images/" + req.params.cuisine));
    let randomImage = files[Math.floor(Math.random() * files.length)];
    res.sendFile(__parentDir + `/public/images/${req.params.cuisine}/${randomImage}`);
});

module.exports = router;
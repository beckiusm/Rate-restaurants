const router = require('express').Router();
const request = require("request");

router.get("/:id?", (req, res) => {
    if (req.query.cuisine) { // cuisine paramter
        request(`http://localhost:3000/api/restaurants/cuisine/${req.query.cuisine}`, (err, response, body) => {
           res.render("restaurants", {
                data: JSON.parse(body),
                user: req.user
            });
        });
    } else if (!req.params.id) { // no parameters
        request(`http://localhost:3000/api/restaurants/`, (err, response, body) => {
           res.render("restaurants", {
                data: JSON.parse(body),
                user: req.user
            }) 
        });
    } else { // with id paraeter
        request(`http://localhost:3000/api/restaurants/${req.params.id}`, (err, response, body) => {
           res.render("restaurant", {
                restaurant: JSON.parse(body),
                user: req.user
            }) 
        });
    }
});

module.exports = router;
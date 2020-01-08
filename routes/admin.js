const router = require('express').Router();
const request = require("request");

router.get("/", (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        res.send("Not authorized");
    } else if (req.user.role === "admin") {
        res.render("admin", {user: req.user});
    }
});

router.post("/addRestaurant", (req, res) => {
    request.post("http://localhost:3000/api/addRestaurant").form(req.body);
    res.redirect("/admin");
});

router.post("/editRestaurant", (req, res) => {
    console.log(req.body);
    request.patch(`http://localhost:3000/api/updateRestaurant/${req.body.id}`).form(req.body);
    res.redirect("/admin");
});


router.post("/deleteRestaurant", (req, res) => {
    request.delete(`http://localhost:3000/api/deleteRestaurant/${req.body.id}`).form(req.body);
    res.redirect("/admin");
});


module.exports = router;
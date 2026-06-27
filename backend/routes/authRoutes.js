const express = require("express");
const router = express.Router();
const authController = require("../Controller/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/signup", authController.signup);
router.get("/login", authController.login);

module.exports = router;

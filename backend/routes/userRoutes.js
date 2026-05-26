const express = require('express');
const router = express.Router();
const userController = require('../Controller/userController');
const authMiddleware = require("../middlewares/auth");

// Search routes
router.get("/search", userController.searchUser);                           
router.get("/find", userController.getUserByUsernameOrEmail);               
router.get("/advanced-search", userController.advancedSearch);              
    



module.exports = router;

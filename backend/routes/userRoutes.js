const express = require('express');
const router = express.Router();
const userController = require('../Controller/userController');
const authMiddleware = require("../middlewares/auth");
const { upload, handleMulterError } = require('../middlewares/upload');


// Search routes
router.get("/search",  authMiddleware,userController.searchUser);                           
router.get("/find",  authMiddleware,userController.getUserByUsernameOrEmail);               
router.get("/advanced-search", authMiddleware, userController.advancedSearch);
router.put("/update-profile", authMiddleware, upload.single("profile_img"), handleMulterError, userController.updateProfile);
router.get("/me", authMiddleware, userController.searchById);



module.exports = router;

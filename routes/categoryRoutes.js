const router = require("express").Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middleware/auth");

router.get("/categories", authMiddleware.optional, categoryController.categories);

module.exports = router;

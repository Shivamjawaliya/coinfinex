const router = require("express").Router();
const categoryController = require("../controllers/categoryController");

router.get("/categories", categoryController.categories);

module.exports = router;

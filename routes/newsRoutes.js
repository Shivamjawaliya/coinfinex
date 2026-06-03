const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const newsController = require("../controllers/newsController");

router.get("/news", authMiddleware, newsController.news);

module.exports = router;

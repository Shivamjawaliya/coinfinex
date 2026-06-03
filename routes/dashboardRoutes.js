const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");

router.get("/dashboard/:id", authMiddleware, dashboardController.dashboard);

module.exports = router;

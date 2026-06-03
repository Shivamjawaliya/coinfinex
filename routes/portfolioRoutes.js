const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const portfolioController = require("../controllers/portfolioController");

router.post("/buy-stock", authMiddleware, portfolioController.buyStock);
router.post("/sell-stock", authMiddleware, portfolioController.sellStock);
router.get("/Portfolio", authMiddleware, portfolioController.portfolio);
router.get("/virtual-trading", authMiddleware, portfolioController.virtualTrading);
router.post("/reset-portfolio", authMiddleware, portfolioController.resetPortfolio);

module.exports = router;

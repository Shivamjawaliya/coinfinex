const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const stockController = require("../controllers/stockController");

router.get("/stock/:id", authMiddleware, stockController.stockDetail);
router.get("/api/yahoo-price/:symbol", stockController.yahooPrice);

module.exports = router;

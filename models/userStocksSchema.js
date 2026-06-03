const mongoose = require("mongoose");

const userstocksSchema = new mongoose.Schema({
  userid: { type: String, required: true },
  stockname: { type: String, required: true },
  stockquantity: { type: Number, required: true },
  stockbuyprice: { type: Number, required: true },
});

module.exports = mongoose.model("userstocks", userstocksSchema);

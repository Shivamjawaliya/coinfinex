const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/keys");

module.exports = async function (req, res, next) {
  const tok = req.cookies?.token;

  if (!tok) {
    return res.render("dashboard", {
      user: { name: "Unknown", role: "Unknown", initials: "U" },
    });
  }

  try {
    const decoded = jwt.verify(tok, jwtSecret);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.render("dashboard", {
      user: { name: "Unknown", role: "Unknown", initials: "U" },
    });
  }
};

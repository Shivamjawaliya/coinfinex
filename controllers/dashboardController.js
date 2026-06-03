const userModel = require("../models/userModel");

exports.dashboard = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if token user matches URL user
    if (req.user.email !== id) {
      return res.render("dashboard", {
        user: { name: "Unknown", role: "Unknown", initials: "U" },
      });
    }

    const u = await userModel.findOne({ username: id });

    const displayName = u?.username || id;

    const initials =
      displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "U";

    res.render("dashboard", {
      user: {
        name: displayName,
        role: u ? "User" : "Unknown",
        initials,
      },
    });
  } catch (error) {
    console.error("Dashboard load failed:", error);
    res.render("dashboard", {
      user: { name: "Unknown", role: "Unknown", initials: "U" },
    });
  }
};

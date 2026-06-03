const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { jwtSecret } = require("../config/keys");

// GET / — landing page (renders index, with user if logged in)
exports.home = async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const data = jwt.verify(token, jwtSecret);
      const user = await userModel.findOne({ username: data.email });
      return res.render("index", { user });
    } catch {
      res.clearCookie("token");
    }
  }
  return res.render("index", { user: null });
};

// GET /me — return logged-in user as JSON
exports.me = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ user: null });

  try {
    const data = jwt.verify(token, jwtSecret);
    const user = await userModel
      .findOne({ username: data.email })
      .select("-password");
    return res.json({ user });
  } catch {
    return res.status(401).json({ user: null });
  }
};

exports.loginPage = (req, res) => res.render("login");

exports.signupPage = (req, res) => res.render("signup");

exports.login = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await userModel.findOne({ username: email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send("Invalid credentials");
    }

    const token = jwt.sign({ email }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    console.log("Login success for:", user.username);
    return res.redirect(`/dashboard/${encodeURIComponent(user.username)}`);
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).send("Login failed");
  }
};

exports.signup = async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  let user = await userModel.findOne({ username: email });
  if (user) return res.status(504).send("user is already registerd");

  if (password !== confirmPassword) {
    return res.status(400).send("Password and confirm password do not match");
  }

  try {
    const bcrypt_pass = await bcrypt.hash(password, 10);
    const createUser = await userModel.create({
      name: name,
      username: email,
      password: bcrypt_pass,
    });
    // After signup, redirect to dashboard with the created user's id (username/email).
    const token = jwt.sign({ email }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    return res.redirect(`/dashboard/${encodeURIComponent(createUser.username)}`);
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).send("Signup failed");
  }
};

exports.logout = (req, res) => {
  res.cookie("token", "");
  res.render("index", { user: null });
};

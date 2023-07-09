import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

// using middlewares

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "practice",
  })
  .then(() => {
    console.log("Connect to db");
  })
  .catch((err) => {
    console.log(err);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = new mongoose.model("User", userSchema);

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "tuemshar");
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.render("login");
  }
};

// get apis

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, { httpOnly: true, expires: new Date(Date.now()) });
  res.redirect("/");
});

// post apis

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/register");
  }
  const isMatched = await bcrypt.compare(password, user.password);

  if (isMatched) {
    const token = jwt.sign({ _id: user._id }, "tuemshar");
    res.cookie("token", token, {
      expires: new Date(Date.now() + 60 * 1000),
      httpOnly: true,
    });

    return res.redirect("/");
  } else {
    return res.render("login", { email, message: "Incorrect Password" });
  }
});

app.post("/register", async (req, res) => {
  const { name, password, email } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user = await User.create({ name, email, password: hashedPassword });
  const token = jwt.sign({ _id: user._id }, "tuemshar");
  res.cookie("token", token, {
    expires: new Date(Date.now() + 60 * 1000),
    httpOnly: true,
  });
  res.redirect("/");
});

app.listen(2000, () => {
  console.log("Server started");
});

// app.get("/success", (req, res) => {
//   res.render("success");
// });

// app.post("/", (req, res) => {
//   users.push({ userName: req.body.name, email: req.body.email });
//   console.log(users);
//   //   res.status(200).json({ success: true, users });
//   //   res.render("success");
//   res.redirect("/success");
// });

// app.get("/users");

const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();

// incoming JSON body read karne ke liye
app.use(express.json());


// 2. public folder ke HTML/CSS/JS ko serve karne ke liye
app.use(express.static("public"));
// Signup/login routes
app.use("/api/auth", authRoutes);

module.exports = app;
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const needRoutes = require("./routes/needRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const disputeRoutes = require("./routes/disputeRoutes");


const app = express();

// incoming JSON body read karne ke liye
app.use(express.json());


// Website khulte hi seedha signup page par le jao
app.get("/", (req, res) => {
    res.redirect("/pages/signup.html");
});


// 2. public folder ke HTML/CSS/JS ko serve karne ke liye
app.use(express.static("public"));
// Signup/login routes
app.use("/api/auth", authRoutes);
app.use("/api/needs", needRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/disputes", disputeRoutes);

module.exports = app;
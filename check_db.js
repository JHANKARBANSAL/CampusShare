require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'email name');
    console.log("Users:", users);
    process.exit(0);
};
run();

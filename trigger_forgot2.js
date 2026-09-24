require('dotenv').config();
const mongoose = require('mongoose');
const { forgotPassword } = require('./controllers/authController');
const User = require('./models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    // find an existing user
    const user = await User.findOne();
    if (!user) {
        console.log("No users in DB");
        process.exit(1);
    }
    
    console.log("Testing with email:", user.email);
    
    // clear rate limit
    user.otpSentAt = new Date(Date.now() - 100000);
    await user.save();
    
    const req = { body: { email: user.email } };
    const res = {
        status: function(code) { this.code = code; return this; },
        json: function(data) { console.log('Response:', this.code, data); }
    };
    
    await forgotPassword(req, res);
    process.exit(0);
};
run();

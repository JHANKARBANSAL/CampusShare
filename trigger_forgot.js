require('dotenv').config();
const mongoose = require('mongoose');
const { forgotPassword } = require('./controllers/authController');
const User = require('./models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create a mock req/res
    const req = { body: { email: 'bjhankar09@gmail.com' } };
    const res = {
        status: function(code) { this.code = code; return this; },
        json: function(data) { console.log('Response:', this.code, data); }
    };
    
    // Create user if not exists so it doesn't fail
    let user = await User.findOne({ email: 'bjhankar09@gmail.com' });
    if (!user) {
        user = new User({ email: 'bjhankar09@gmail.com', name: 'Jhankar', passwordHash: '123' });
        await user.save();
    }
    
    // Just force clear the rate limit
    user.otpSentAt = new Date(Date.now() - 100000);
    await user.save();

    await forgotPassword(req, res);
    process.exit(0);
};
run();

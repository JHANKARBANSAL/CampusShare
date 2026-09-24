require('dotenv').config();
const mongoose = require('mongoose');
const { login } = require('./controllers/authController');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const req = {
        body: {
            email: "test.student@bmu.edu.in",
            password: "password123"
        }
    };
    const res = {
        status: function(code) { this.code = code; return this; },
        json: function(data) { console.log('Response:', this.code, data); }
    };
    try {
        await login(req, res);
    } catch(e) {
        console.error("Error:", e);
    }
    process.exit(0);
};
run();

require('dotenv').config();
const mongoose = require('mongoose');
const { createOffer } = require('./controllers/transactionController');
const NeedPost = require('./models/NeedPost');
const User = require('./models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find an open need
    const need = await NeedPost.findOne({ status: 'open' });
    if (!need) {
        console.log("No open needs found.");
        process.exit(1);
    }
    
    // Find a user who is NOT the requester
    const helper = await User.findOne({ _id: { $ne: need.requestedBy } });
    
    const req = {
        user: { id: helper._id.toString() },
        body: { needId: need._id.toString() }
    };
    
    const res = {
        status: function(code) { this.code = code; return this; },
        json: function(data) { console.log('Response:', this.code, data); }
    };
    
    console.log("Testing with helper:", helper.email, "for need:", need.itemName);
    
    // Clear any previous transaction to avoid "already offered" error
    const Transaction = require('./models/Transaction');
    await Transaction.deleteMany({ needPost: need._id, lender: helper._id });
    
    await createOffer(req, res);
    
    // wait a bit for async background task
    setTimeout(() => process.exit(0), 2000);
};
run();

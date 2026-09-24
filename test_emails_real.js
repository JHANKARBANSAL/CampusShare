require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function run() {
    console.log("🚀 Starting Real Email Test...");
    
    // 1. Test College Email
    try {
        console.log("\n1️⃣ Sending to College Email (jhankar.bansal.23cse@bmu.edu.in)...");
        await sendEmail({
            to: "jhankar.bansal.23cse@bmu.edu.in",
            subject: "Test 1: College Email Delivery",
            text: "If you see this, the college firewall allowed it through!",
            html: "<p>If you see this, the college firewall allowed it through!</p>"
        });
        console.log("✅ Brevo successfully processed the College Email!");
    } catch (e) {
        console.log("❌ Error sending to College Email:", e);
    }

    // 2. Test Normal Email
    try {
        console.log("\n2️⃣ Sending to Normal Email (bjhankar09@gmail.com)...");
        await sendEmail({
            to: "bjhankar09@gmail.com",
            subject: "Test 2: Normal Email Delivery",
            text: "If you see this, check your Spam folder!",
            html: "<p>If you see this, check your Spam folder!</p>"
        });
        console.log("✅ Brevo successfully processed the Normal Email!");
    } catch (e) {
        console.log("❌ Error sending to Normal Email:", e);
    }
    
    console.log("\n🏁 Tests complete.");
    process.exit(0);
}
run();

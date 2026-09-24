require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

sendEmail({
    to: 'bjhankar09@gmail.com',
    subject: 'Test Email',
    text: 'This is a test',
    html: '<p>Test</p>'
}).then(() => console.log('Sent!'))
.catch(e => console.error('Error:', e.message));

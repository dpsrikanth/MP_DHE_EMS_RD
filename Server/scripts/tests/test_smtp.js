require("dotenv").config();
const sendEmail = require('../../utils/sendEmail');

async function testEmail() {
    try {
        console.log("Testing email configuration...");
        await sendEmail({
            email: "alokmalewar@gmail.com",
            subject: "EMS Portal - SMTP Connection Test",
            message: "If you are reading this, the EMS email configuration is working successfully!"
        });
        console.log("SUCCESS! The test email has been processed.");
    } catch (err) {
        console.error("FAILED to send test email. Error details:");
        console.error(err);
    }
}

testEmail();

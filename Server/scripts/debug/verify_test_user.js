const client = require('../../db');

async function verifySpecificUser() {
    try {
        console.log("Verifying test user 'alokmalewar@gmail.com'...");
        await client.query(`
            UPDATE users SET is_verified = TRUE WHERE email = 'alokmalewar@gmail.com';
        `);
        console.log("User verified successfully. They can now log in.");
        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
}

verifySpecificUser();

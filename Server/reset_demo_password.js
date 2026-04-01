const client = require('./db');

async function resetForTest() {
    try {
        console.log("Resetting alokmalewar@gmail.com for testing First Time Login flow...");
        await client.query("UPDATE users SET is_verified = false, otp = null, password_hash = null WHERE email = 'alokmalewar@gmail.com'");
        console.log("Done. Ready to test.");
        process.exit();
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

resetForTest();

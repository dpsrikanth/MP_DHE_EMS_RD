const pool = require('./db');

async function clearSecrecyData() {
    console.log('Clearing Secrecy Dashboard Data:');
    
    try {
        console.log('1. Deleting all paper setter payments...');
        await pool.query('DELETE FROM paper_setter_payments');

        console.log('2. Deleting all uploaded question papers...');
        await pool.query('DELETE FROM question_papers');

        console.log('3. Deleting all paper assignments...');
        await pool.query('DELETE FROM paper_assignments');

        console.log('\nSUCCESS: Database tables for paper submissions have been cleared.');
        console.log('Secrecy dashboard should now be empty for fresh testing.');

    } catch (err) {
        console.error('Error during cleanup:', err);
    } finally {
        pool.end();
    }
}

clearSecrecyData();

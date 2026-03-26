const pool = require('./db');

async function verifyStatusUpdate() {
    console.log('Testing Secrecy Status Update and Payment Creation:');
    
    const assignment_id = 23; 
    const status = 'Finalized';
    const feedback = 'Approved by Secrecy';

    try {
        console.log(`1. Updating Assignment ${assignment_id} to ${status}...`);
        
        // Simulating secrecyController.updatePaperStatus
        await pool.query(`
            UPDATE paper_assignments 
            SET status = $2, feedback = $3, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1
        `, [assignment_id, status, feedback]);

        console.log('2. Auto-creating payment entry...');
        const paymentRes = await pool.query(`
            INSERT INTO paper_setter_payments (assignment_id, paper_setter_id, amount, status)
            SELECT id, paper_setter_id, 5000, 'Pending'
            FROM paper_assignments WHERE id = $1
            ON CONFLICT (assignment_id) DO NOTHING
            RETURNING *
        `, [assignment_id]);

        if (paymentRes.rows.length > 0) {
            console.log('SUCCESS: Payment entry created.');
            console.log('Payment Record:', JSON.stringify(paymentRes.rows[0], null, 2));
        } else {
            console.log('INFO: Payment entry already exists (Conflict hit).');
            const check = await pool.query('SELECT * FROM paper_setter_payments WHERE assignment_id = $1', [assignment_id]);
            console.log('Existing Payment Record:', JSON.stringify(check.rows[0], null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

verifyStatusUpdate();

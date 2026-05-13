require('dotenv').config({ path: './config/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
});

const ARGS = process.argv.slice(2);
const TARGET_AY = parseInt(ARGS[0]) || 1;
const TARGET_SEM = parseInt(ARGS[1]) || 15;
const BASE_DATE_STR = ARGS[2] || '2024-07-14';

function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

const TEMPLATES = {
    'Commencement of Classes': { responsibility: 'College Admin', type: 'Internal' },
    'INTERNAL EXAM 1 SCHEDULE DETAILS (MID-1)': { responsibility: 'COLLEGE', type: 'Internal' },
    'Internal Exam 1 (Mid-1)': { responsibility: 'College', type: 'Internal' },
    'Internal Marks Entry (Mid-1)': { responsibility: 'Faculty', type: 'Internal' },
    'Internal Marks Approval (Mid-1)': { responsibility: 'HOD', type: 'Internal' },
    'INTERNAL EXAM 2 SCHEDULE DETAILS (MID-2)': { responsibility: 'COLLEGE', type: 'Internal' },
    'Internal Exam 2 (Mid-2)': { responsibility: 'College', type: 'Internal' },
    'Internal Marks Entry (Mid-2)': { responsibility: 'Faculty', type: 'Internal' },
    'Internal Marks Approval (Mid-2)': { responsibility: 'HOD', type: 'Internal' },
    'INTERNAL EXAM 3 SCHEDULE DETAILS (MID-3)': { responsibility: 'COLLEGE', type: 'Internal' },
    'Internal Exam 3 (Mid-3)': { responsibility: 'College', type: 'Internal' },
    'Internal Marks Entry (Mid-3)': { responsibility: 'Faculty', type: 'Internal' },
    'Internal Marks Approval (Mid-3)': { responsibility: 'HOD', type: 'Internal' },
    'PRACTICAL EXAM SCHEDULE DETAILS': { responsibility: 'COLLEGE', type: 'Internal' },
    'Practical Exam': { responsibility: 'College', type: 'Internal' },
    'Practical Marks Entry': { responsibility: 'Faculty', type: 'Internal' },
    'Practical Marks Approval': { responsibility: 'HOD', type: 'Internal' },
    'HOD Approval': { responsibility: 'HOD', type: 'Internal' },
    'Internal Marks Lock & Submission': { responsibility: 'College Admin', type: 'Internal' },
    'External Exam Registration': { responsibility: 'University Admin', type: 'Internal' },
    'Student Enroll for External Exam': { responsibility: 'Student Login', type: 'Internal' },
    'Question Paper Upload': { responsibility: 'Paper Setters', type: 'Internal' },
    'Question Paper Finalization': { responsibility: 'Secrecy Department', type: 'Internal' },
    'Seat Allocation & Mapping': { responsibility: 'College Admin', type: 'Internal' },
    'Seating Arrangement Lock': { responsibility: 'College Admin', type: 'Internal' },
    'Hall Ticket Release': { responsibility: 'University', type: 'Internal' },
    'External Faculty Assignment': { responsibility: 'University Admin', type: 'Internal' },
    'Last Working Day': { responsibility: 'College', type: 'Internal' },
    'External (End Semester) Exams': { responsibility: 'University', type: 'Internal' },
    'Valuation of Answer Scripts': { responsibility: 'University', type: 'Internal' },
    'Results Declaration': { responsibility: 'University', type: 'Internal' }
};

const standardSequence = [
    { name: 'Commencement of Classes', offset: 0, duration: 0 },
    { name: 'INTERNAL EXAM 1 SCHEDULE DETAILS (MID-1)', offset: 15, duration: 4 },
    { name: 'Internal Exam 1 (Mid-1)', offset: 25, duration: 5 },
    { name: 'Internal Marks Entry (Mid-1)', offset: 31, duration: 4 },
    { name: 'Internal Marks Approval (Mid-1)', offset: 36, duration: 1 },
    { name: 'INTERNAL EXAM 2 SCHEDULE DETAILS (MID-2)', offset: 50, duration: 4 },
    { name: 'Internal Exam 2 (Mid-2)', offset: 60, duration: 5 },
    { name: 'Internal Marks Entry (Mid-2)', offset: 66, duration: 4 },
    { name: 'Internal Marks Approval (Mid-2)', offset: 71, duration: 1 },
    { name: 'INTERNAL EXAM 3 SCHEDULE DETAILS (MID-3)', offset: 85, duration: 4 },
    { name: 'Internal Exam 3 (Mid-3)', offset: 95, duration: 5 },
    { name: 'Internal Marks Entry (Mid-3)', offset: 101, duration: 4 },
    { name: 'Internal Marks Approval (Mid-3)', offset: 106, duration: 1 },
    { name: 'PRACTICAL EXAM SCHEDULE DETAILS', offset: 110, duration: 5 },
    { name: 'Practical Exam', offset: 116, duration: 4 },
    { name: 'Practical Marks Entry', offset: 121, duration: 2 },
    { name: 'Practical Marks Approval', offset: 124, duration: 1 },
    { name: 'HOD Approval', offset: 126, duration: 2 },
    { name: 'Internal Marks Lock & Submission', offset: 129, duration: 2 },
    { name: 'External Exam Registration', offset: 129, duration: 10 },
    { name: 'Student Enroll for External Exam', offset: 132, duration: 2 },
    { name: 'Question Paper Upload', offset: 135, duration: 2 },
    { name: 'Question Paper Finalization', offset: 138, duration: 1 },
    { name: 'Seat Allocation & Mapping', offset: 140, duration: 1 },
    { name: 'Seating Arrangement Lock', offset: 142, duration: 1 },
    { name: 'Hall Ticket Release', offset: 144, duration: 1 },
    { name: 'External Faculty Assignment', offset: 146, duration: 7 },
    { name: 'Last Working Day', offset: 155, duration: 0 },
    { name: 'External (End Semester) Exams', offset: 156, duration: 15 },
    { name: 'Valuation of Answer Scripts', offset: 175, duration: 15 },
    { name: 'Results Declaration', offset: 195, duration: 0 },
];

async function main() {
    console.log(`=== MILESTONE SEQUENCE FIXER & POPULATOR ===`);
    console.log(`Target Academic Year ID: ${TARGET_AY}`);
    console.log(`Target Semester ID: ${TARGET_SEM}`);
    console.log(`Base Date (Commencement): ${BASE_DATE_STR}\n`);

    const { rows: milestones } = await pool.query(`
        SELECT id, name FROM academic_milestones 
        WHERE academic_year_id = $1 AND semester_id = $2 AND delete_status = true
    `, [TARGET_AY, TARGET_SEM]);

    console.log(`Found ${milestones.length} existing milestones.\n`);

    for (const rule of standardSequence) {
        let target = milestones.find(m => m.name.toUpperCase().trim() === rule.name.toUpperCase().trim())
                  || milestones.find(m => m.name.toUpperCase().includes(rule.name.toUpperCase()) || rule.name.toUpperCase().includes(m.name.toUpperCase()));

        const start = addDays(BASE_DATE_STR, rule.offset);
        const end = addDays(start, rule.duration);

        if (target) {
            // Update existing
            await pool.query(`
                UPDATE academic_milestones 
                SET start_date = $1, end_date = $2 
                WHERE id = $3
            `, [start, end, target.id]);
            console.log(`✓ Updated "${target.name}" -> ${start} to ${end}`);
            
            // Remove from list to avoid double matching
            const idx = milestones.indexOf(target);
            milestones.splice(idx, 1);
        } else {
            // Create missing
            const template = TEMPLATES[rule.name];
            if (template) {
                await pool.query(`
                    INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type, academic_year_id, semester_id, delete_status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                `, [rule.name, start, end, template.responsibility, template.type, TARGET_AY, TARGET_SEM]);
                console.log(`+ Created "${rule.name}" -> ${start} to ${end}`);
            } else {
                console.log(`? No template for missing milestone: "${rule.name}"`);
            }
        }
    }

    console.log(`\nFinished processing ${standardSequence.length} milestones.`);
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

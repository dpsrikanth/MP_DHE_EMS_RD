const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const algorithm = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'my-secret-key-that-is-32-bytes-!'; 
const uploadsDir = path.join(__dirname, 'uploads', 'secure_papers');

async function test() {
  try {
    const { rows } = await pool.query('SELECT * FROM question_papers ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) { console.log('No papers found'); return; }
    const paper = rows[0];
    console.log('Testing Paper ID:', paper.id);

    const encryptedFilePath = path.join(uploadsDir, paper.file_path);
    console.log('Path:', encryptedFilePath);
    if (!fs.existsSync(encryptedFilePath)) {
      console.log('FILE MISSING');
      process.exit(1);
    }

    const iv = Buffer.from(paper.iv, 'hex');
    console.log('IV Length:', iv.length);
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), iv);

    const input = fs.createReadStream(encryptedFilePath);
    
    // Instead of streaming to a response, stream to a dummy or a devnull
    decipher.on('error', err => {
      console.error('DECIPHER ERROR:', err.message);
      process.exit(1);
    });
    input.on('error', err => {
      console.error('INPUT ERROR:', err.message);
      process.exit(1);
    });

    let chunks = [];
    decipher.on('data', d => chunks.push(d));
    decipher.on('end', () => {
      console.log('SUCCESS: Decrypted', Buffer.concat(chunks).length, 'bytes');
      process.exit(0);
    });

    input.pipe(decipher);
  } catch(e) {
    console.error('UNEXPECTED ERROR:', e);
  }
}
test();

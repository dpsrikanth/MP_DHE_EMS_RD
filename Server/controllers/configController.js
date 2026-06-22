const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// dotenv is loaded from Server/config/.env (see server.js), so point here too.
const envPath = path.join(__dirname, '../config/.env');

// Build a transporter from the currently active SMTP environment variables,
// mirroring Server/utils/sendEmail.js so a passing test reflects real sends.
const buildTransport = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT == '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const getSmtpConfig = (req, res) => {
  try {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    
    res.json({
      host: envConfig.SMTP_HOST || '',
      port: envConfig.SMTP_PORT || '',
      user: envConfig.SMTP_USER || '',
      password: envConfig.SMTP_PASS || '',
      displayName: envConfig.FROM_NAME || '',
      fromEmail: envConfig.FROM_EMAIL || ''
    });
  } catch (error) {
    console.error("Error reading SMTP config:", error);
    res.status(500).json({ message: "Failed to read SMTP configuration" });
  }
};

const updateSmtpConfig = (req, res) => {
  try {
    const { host, port, user, password, displayName, fromEmail } = req.body;
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    const updates = {
      'SMTP_HOST': host,
      'SMTP_PORT': port,
      'SMTP_USER': user,
      'SMTP_PASS': password,
      'FROM_NAME': displayName,
      'FROM_EMAIL': fromEmail || user
    };

    let newLines = [...lines];
    
    Object.keys(updates).forEach(key => {
      const index = newLines.findIndex(line => line.startsWith(`${key}=`));
      if (index !== -1) {
        newLines[index] = `${key}=${updates[key]}`;
      } else {
        newLines.push(`${key}=${updates[key]}`);
      }
    });

    fs.writeFileSync(envPath, newLines.join('\n'));
    
    // Update process.env for the current session
    process.env.SMTP_HOST = host;
    process.env.SMTP_PORT = port;
    process.env.SMTP_USER = user;
    process.env.SMTP_PASS = password;
    process.env.FROM_NAME = displayName;
    process.env.FROM_EMAIL = fromEmail || user;

    res.json({ message: "SMTP Configuration updated successfully" });
  } catch (error) {
    console.error("Error updating SMTP config:", error);
    res.status(500).json({ message: "Failed to update SMTP configuration" });
  }
};

// Test the active SMTP configuration.
// Always verifies the connection + credentials. If `testEmail` is supplied,
// also sends a real test message to that address.
const testSmtpConfig = async (req, res) => {
  const { testEmail } = req.body || {};

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return res.status(400).json({ success: false, message: "SMTP is not configured on the server." });
  }

  try {
    const transporter = buildTransport();

    // Step 1: verify connection + authentication
    await transporter.verify();

    // Step 2: optionally send an actual test email
    if (testEmail) {
      await transporter.sendMail({
        from: `${process.env.FROM_NAME || 'EMS Admin'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: testEmail,
        subject: 'EMS SMTP Test Email',
        text: 'This is a test email from the EMS system. If you received this, your SMTP configuration is working correctly.',
        html: '<p>This is a <b>test email</b> from the EMS system.</p><p>If you received this, your outgoing email configuration is working correctly.</p>'
      });
      return res.json({ success: true, message: `Connection verified and test email sent to ${testEmail}.` });
    }

    return res.json({ success: true, message: "SMTP connection verified — server reachable and credentials accepted." });
  } catch (error) {
    console.error("SMTP test error:", error);
    return res.status(400).json({ success: false, message: error.message || "SMTP test failed." });
  }
};

module.exports = {
  getSmtpConfig,
  updateSmtpConfig,
  testSmtpConfig
};

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../.env');

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

module.exports = {
  getSmtpConfig,
  updateSmtpConfig
};

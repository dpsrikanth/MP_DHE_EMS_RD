const fs = require('fs');
const path = require('path');

function searchFiles(dir, searchTerm) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      searchFiles(filePath, searchTerm);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.sql'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(searchTerm)) {
        console.log(`Match in: ${filePath}`);
      }
    }
  }
}

console.log("Searching for assigned_college_id in server directory...");
searchFiles('d:\\MP_DHE_EMS_RD\\server', 'assigned_college_id');
console.log("Searching for allocated_college_id in server directory...");
searchFiles('d:\\MP_DHE_EMS_RD\\server', 'allocated_college_id');

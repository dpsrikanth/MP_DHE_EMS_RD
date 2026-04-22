const fs = require('fs');
const path = require('path');

const baseDir = path.join('c:', 'Users', 'Anusha', 'Documents', 'MP_DHE_EMS_RD', 'Server', 'scripts');
const folders = ['debug', 'migrations', 'tests', 'temp', 'maintenance'];

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Pattern 1: require('./db') -> require('../../db') 
    // (for files originally in Server root)
    const regex1 = /require\(['"]\.\/([^'"]+)['"]\)/g;
    content = content.replace(regex1, (match, p1) => {
        // Skip if it already has ../ (though unlikely)
        if (p1.startsWith('../')) return match;
        changed = true;
        return `require('../../${p1}')`;
    });

    // Pattern 2: require('./Server/db') -> require('../../db')
    // (for files originally in project root)
    const regex2 = /require\(['"]\.\/Server\/([^'"]+)['"]\)/g;
    content = content.replace(regex2, (match, p1) => {
        changed = true;
        return `require('../../${p1}')`;
    });

    // Pattern 3: require('../Server/db') -> require('../../db')
    // (in case some already had one level up)
    const regex3 = /require\(['"]\.\.\/Server\/([^'"]+)['"]\)/g;
    content = content.replace(regex3, (match, p1) => {
        changed = true;
        return `require('../../${p1}')`;
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

folders.forEach(folder => {
    const dirPath = path.join(baseDir, folder);
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            updateFile(path.join(dirPath, file));
        }
    });
});

console.log('Path updates for Server scripts complete.');

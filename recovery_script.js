const fs = require('fs');
const path = 'Server/controllers/controller.js';
let content = fs.readFileSync(path, 'utf8');

// Find the corrupted block
const corrupted = `    } catch (error) {
  } catch (error) {`;

if (content.includes(corrupted)) {
    content = content.replace(corrupted, '    } catch (error) {');
    fs.writeFileSync(path, content);
    console.log('Success: Corrupted catch block fixed.');
} else {
    console.log('Corrupted block not found. Trying another way...');
    // Look for duplicate catch manually if needed
    const lines = content.split('\n');
    let fixed = false;
    for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].includes('} catch (error) {') && lines[i+1].includes('} catch (error) {')) {
            lines.splice(i, 1);
            fixed = true;
            break;
        }
    }
    if (fixed) {
        fs.writeFileSync(path, lines.join('\n'));
        console.log('Success: Duplicate catch line removed.');
    } else {
        console.log('No duplicate catch found.');
    }
}

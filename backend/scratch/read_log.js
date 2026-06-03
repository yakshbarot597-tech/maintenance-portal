const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '..', '..', 'server.log');
try {
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf16le');
        const lines = content.split('\n');
        console.log(`Last 50 lines of server.log (total ${lines.length} lines):`);
        console.log(lines.slice(-50).join('\n'));
    } else {
        console.log("server.log does not exist at", logPath);
    }
} catch (err) {
    console.error("Error reading log:", err);
}

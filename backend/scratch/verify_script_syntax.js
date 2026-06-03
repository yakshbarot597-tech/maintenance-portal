const fs = require('fs');

try {
    const code = fs.readFileSync('c:\\Users\\301461\\Desktop\\boxxxxxx\\message\\maintenance\\frontend\\script.js', 'utf8');
    new Function(code);
    console.log("Syntax check passed!");
} catch (e) {
    console.error("Syntax error in script.js:", e.message);
}

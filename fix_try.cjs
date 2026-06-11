const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

// Replace the broken try block
code = code.replace(/\/\/ HTTP server\s+try \{\s+const tokenPath = '\/api\/v2\/auth\/token\/get';/, '// HTTP server');

fs.writeFileSync('server/index.js', code);
console.log('Fixed');

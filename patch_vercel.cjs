const fs = require('fs');

let code = fs.readFileSync('server/index.js', 'utf8');

// Disable SSL generation block
code = code.replace(
  "const CERTS_DIR = path.join(__dirname, 'certs');",
  "if (!process.env.VERCEL) {\nconst CERTS_DIR = path.join(__dirname, 'certs');"
);

code = code.replace(
  "console.log('  ✅ Certificado gerado e salvo em server/certs/');\n}",
  "console.log('  ✅ Certificado gerado e salvo em server/certs/');\n}\n}"
);

// Disable dotenv block (Vercel provides env vars automatically)
code = code.replace(
  "const ENV_PATH = process.env.ENV_PATH || path.join(__dirname, '..', '.env');\ndotenv.config({ path: ENV_PATH });",
  "if (!process.env.VERCEL) {\n  const ENV_PATH = process.env.ENV_PATH || path.join(__dirname, '..', '.env');\n  dotenv.config({ path: ENV_PATH });\n}"
);

fs.writeFileSync('server/index.js', code);
console.log('Successfully patched index.js for Vercel');

const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

// Fix the unclosed if statement from earlier
code = code.replace("if (!process.env.VERCEL) {\nconst CERTS_DIR = path.join(__dirname, 'certs');", "const CERTS_DIR = path.join(__dirname, 'certs');");

// Now do the correct replace for the SSL block
code = code.replace(
  "const CERTS_DIR = path.join(__dirname, 'certs');\nif (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });\n\nconst keyPath = path.join(CERTS_DIR, 'server.key');\nconst certPath = path.join(CERTS_DIR, 'server.cert');\n\nlet sslKey, sslCert;\n\nif (fs.existsSync(keyPath) && fs.existsSync(certPath)) {\n  sslKey = fs.readFileSync(keyPath);\n  sslCert = fs.readFileSync(certPath);\n  console.log('  🔒  SSL: Usando certificados existentes');\n} else {\n  console.log('  🔒  SSL: Gerando certificado auto-assinado...');\n  const attrs = [{ name: 'commonName', value: AUTH_DOMAIN }];\n  const pems = await selfsigned.generate(attrs, {\n    algorithm: 'sha256',\n    days: 365,\n    keySize: 2048,\n    extensions: [\n      { name: 'subjectAltName', altNames: [\n        { type: 2, value: AUTH_DOMAIN },\n        { type: 2, value: 'localhost' },\n        { type: 7, ip: '127.0.0.1' },\n      ]},\n    ],\n  });\n  sslKey = pems.private;\n  sslCert = pems.cert;\n  fs.writeFileSync(keyPath, sslKey);\n  fs.writeFileSync(certPath, sslCert);\n  console.log('  ✅ Certificado gerado e salvo em server/certs/');\n}",
  "let sslKey, sslCert;\nif (!process.env.VERCEL) {\n  const CERTS_DIR = path.join(__dirname, 'certs');\n  if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });\n\n  const keyPath = path.join(CERTS_DIR, 'server.key');\n  const certPath = path.join(CERTS_DIR, 'server.cert');\n\n  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {\n    sslKey = fs.readFileSync(keyPath);\n    sslCert = fs.readFileSync(certPath);\n    console.log('  🔒  SSL: Usando certificados existentes');\n  } else {\n    console.log('  🔒  SSL: Gerando certificado auto-assinado...');\n    const attrs = [{ name: 'commonName', value: AUTH_DOMAIN }];\n    const pems = await selfsigned.generate(attrs, {\n      algorithm: 'sha256',\n      days: 365,\n      keySize: 2048,\n      extensions: [\n        { name: 'subjectAltName', altNames: [\n          { type: 2, value: AUTH_DOMAIN },\n          { type: 2, value: 'localhost' },\n          { type: 7, ip: '127.0.0.1' },\n        ]},\n      ],\n    });\n    sslKey = pems.private;\n    sslCert = pems.cert;\n    fs.writeFileSync(keyPath, sslKey);\n    fs.writeFileSync(certPath, sslCert);\n    console.log('  ✅ Certificado gerado e salvo em server/certs/');\n  }\n}"
);

// Also disable dotenv block
code = code.replace(
  "const ENV_PATH = process.env.ENV_PATH || path.join(__dirname, '..', '.env');\ndotenv.config({ path: ENV_PATH });",
  "if (!process.env.VERCEL) {\n  const ENV_PATH = process.env.ENV_PATH || path.join(__dirname, '..', '.env');\n  dotenv.config({ path: ENV_PATH });\n}"
);

fs.writeFileSync('server/index.js', code);
console.log('Done');

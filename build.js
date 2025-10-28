// build.js – Cross-platform build for Netlify
const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, 'netlify', 'functions');
const targetFile = path.join(functionsDir, 'api.js');
const sourceFile = path.join(__dirname, 'server.js');

// Create directory
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
  console.log('Created: netlify/functions');
}

// Copy server.js to api.js
fs.copyFileSync(sourceFile, targetFile);
console.log('Copied: server.js → netlify/functions/api.js');

console.log('Build complete! Ready for Netlify.');
// build.js
const fs   = require('fs');
const path = require('path');

const funcDir = path.join(__dirname, 'netlify', 'functions');
const target  = path.join(funcDir, 'api.js');
const src     = path.join(__dirname, 'server.js');

if (!fs.existsSync(funcDir)) fs.mkdirSync(funcDir, { recursive: true });
fs.copyFileSync(src, target);
console.log('copied server.js → netlify/functions/api.js');
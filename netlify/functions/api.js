const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const serverless = require('serverless-http');  // NEW: For Netlify

const app = express();
const PORT = process.env.PORT || 3000;  // For local testing

// Database setup (SQLite file will be in functions/ on Netlify)
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/itech.db' : 'itech.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  else console.log('DB connected');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      discount REAL,
      description TEXT NOT NULL,
      images TEXT
    )
  `);
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Image upload config (Multer writes to /tmp/ in serverless)
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads/' : 'public/uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// API Routes (same as before)
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : []
    })));
  });
});

app.post('/api/products', upload.array('images', 5), (req, res) => {
  const { name, type, price, discount, description } = req.body;
  const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

  if (!name || !type || !price || !description) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const stmt = db.prepare(`
    INSERT INTO products (name, type, price, discount, description, images)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(name, type, parseFloat(price), discount ? parseFloat(discount) : null, description, JSON.stringify(images), function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, images });
  });
  stmt.finalize();
});

app.put('/api/products/:id', upload.array('images', 5), (req, res) => {
  const id = req.params.id;
  const { name, type, price, discount, description, existingImages } = req.body;
  const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  const allImages = [...(existingImages ? JSON.parse(existingImages) : []), ...newImages];

  const stmt = db.prepare(`
    UPDATE products SET name = ?, type = ?, price = ?, discount = ?, description = ?, images = ? WHERE id = ?
  `);
  stmt.run(name, type, parseFloat(price), discount ? parseFloat(discount) : null, description, JSON.stringify(allImages), id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id, images: allImages });
  });
  stmt.finalize();
});

app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT images FROM products WHERE id = ?', [id], (err, row) => {
    if (row && row.images) {
      JSON.parse(row.images).forEach(img => {
        const filePath = path.join(__dirname, img.replace('/uploads/', 'uploads/'));
        fs.unlink(filePath, () => {});
      });
    }
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes > 0 });
    });
  });
});

// Admin Auth
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'itech2025';
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Local server at http://localhost:${PORT}`));
}

// Export for Netlify (serverless)
module.exports = app;
module.exports.handler = serverless(app);
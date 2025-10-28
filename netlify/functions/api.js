// server.js
const express       = require('express');
const multer        = require('multer');
const path          = require('path');
const fs            = require('fs');
const sqlite3       = require('sqlite3').verbose();
const serverless    = require('serverless-http');

const app = express();

// ---------- PATHS ----------
const dbPath    = '/tmp/itech.db';           // ALWAYS /tmp on Netlify
const uploadDir = '/tmp/uploads';            // ALWAYS /tmp

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created:', uploadDir);
}

// ---------- DB ----------
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('DB connection failed:', err.message);
  } else {
    console.log('SQLite connected →', dbPath);
  }
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
  `, err => {
    if (err) console.error('Table creation error:', err.message);
  });
});

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use('/uploads', express.static(uploadDir));  // Serve uploaded images
app.use(express.static(path.join(__dirname, 'public')));

// ---------- MULTER ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// ---------- ROUTES ----------
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : []
    })));
  });
});

app.post('/api/products', upload.array('images', 5), (req, res) => {
  const { name, type, price, discount, description } = req.body;
  const images = req.files ? req.files.map(f => `/uploads/${path.basename(f.path)}`) : [];

  const stmt = db.prepare(`
    INSERT INTO products (name, type, price, discount, description, images)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(name, type, +price, discount ? +discount : null, description, JSON.stringify(images), function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, images });
  });
  stmt.finalize();
});

app.put('/api/products/:id', upload.array('images', 5), (req, res) => {
  const id = req.params.id;
  const { name, type, price, discount, description, existingImages } = req.body;
  const newImgs = req.files ? req.files.map(f => `/uploads/${path.basename(f.path)}`) : [];
  const all = [...(existingImages ? JSON.parse(existingImages) : []), ...newImgs];

  const stmt = db.prepare(`
    UPDATE products SET name=?, type=?, price=?, discount=?, description=?, images=? WHERE id=?
  `);
  stmt.run(name, type, +price, discount ? +discount : null, description, JSON.stringify(all), id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id, images: all });
  });
  stmt.finalize();
});

app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT images FROM products WHERE id=?', [id], (err, row) => {
    if (row && row.images) {
      JSON.parse(row.images).forEach(img => {
        const fp = path.join(uploadDir, path.basename(img));
        fs.unlink(fp, () => {});
      });
    }
    db.run('DELETE FROM products WHERE id=?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes > 0 });
    });
  });
});

app.post('/api/admin/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'itech2025') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// ---------- NETLIFY ----------
module.exports = app;
module.exports.handler = serverless(app);
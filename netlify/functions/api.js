// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());

// ========== SUPABASE CONFIG ==========
const SUPABASE_URL = 'https://gprjairidesvktwzglpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcmphaXJpZGVzdmt0d3pnbHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzQ3MjIsImV4cCI6MjA3NzE1MDcyMn0.9jsUMS47tCLulqF92R6HRgXwNXYr-9YSQXLvU7GVjRE';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ROUTES ==========
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(p => ({ ...p, images: p.images || [] })));
});

app.post('/api/products', async (req, res) => {
  const { name, type, price, discount, description, images } = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([{ name, type, price, discount, description, images }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, type, price, discount, description, images } = req.body;
  const { data, error } = await supabase
    .from('products')
    .update({ name, type, price, discount, description, images })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: 'Not found' });
  res.json(data[0]);
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'itech2025') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// ========== NETLIFY ==========
module.exports = app;
module.exports.handler = serverless(app);
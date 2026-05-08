require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
}));
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/mood',      require('./routes/mood'));
app.use('/api/deadlines', require('./routes/deadlines'));
app.use('/api/stress',    require('./routes/stress'));
app.use('/api/community', require('./routes/community'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Catch-all: serve SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const pool = require('./db/pool');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Đã khởi tạo Database Schema tự động thành công!');
  } catch (err) {
    console.error('❌ Lỗi tạo bảng DB:', err);
  }

  console.log(`\n🎯 SafeScore đang chạy tại http://localhost:${PORT}`);
  console.log(`📦 Môi trường: ${process.env.NODE_ENV || 'development'}\n`);
});

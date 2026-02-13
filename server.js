const express = require('express');
const app = express();
app.use(express.json());

// Ini rute utama biar gak "Cannot GET /" lagi
app.get('/', (req, res) => {
  res.send('<h1>🚀 API Chat Online, Suhu!</h1><p>Status: Running Aman.</p>');
});

// Simulasi database (biar simpel dulu)
const users = [];

// Rute buat DAFTAR (Register)
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  users.push({ username, password });
  res.status(201).json({ message: "User berhasil didaftarin!", user: username });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server ON di port ${PORT}`));

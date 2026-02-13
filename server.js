const express = require('express');
const datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

const db = {
    users: datastore.create({ filename: './data/users.db', autoload: true }),
    messages: datastore.create({ filename: './data/messages.db', autoload: true })
};

const SECRET_KEY = process.env.SECRET_KEY || 'rahasia_bro';

// --- MIDDLEWARE: Cek Token ---
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send({ error: 'Login dulu, Bror!' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).send({ error: 'Token palsu atau expired!' });
    }
};

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const exists = await db.users.findOne({ username });
    if (exists) return res.status(400).send({ error: 'Username udah ada!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.users.insert({ username, password: hashedPassword });
    res.status(201).send({ message: 'User dibuat!', userId: user._id });
});

// 2. LOGIN (Dapetin Token)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.users.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).send({ error: 'Login gagal!' });
    }
    const token = jwt.sign({ _id: user._id, username: user.username }, SECRET_KEY);
    res.send({ user: user.username, token });
});

// 3. KIRIM PESAN (Perlu Auth)
app.post('/api/messages', auth, async (req, res) => {
    const { receiver_id, content } = req.body;
    const msg = await db.messages.insert({
        sender_id: req.user._id,
        sender_name: req.user.username,
        receiver_id,
        content,
        timestamp: new Date()
    });
    res.status(201).send(msg);
});

// 4. AMBIL PESAN (Perlu Auth)
app.get('/api/messages/:other_user_id', auth, async (req, res) => {
    const messages = await db.messages.find({
        $or: [
            { sender_id: req.user._id, receiver_id: req.params.other_user_id },
            { sender_id: req.params.other_user_id, receiver_id: req.user._id }
        ]
    }).sort({ timestamp: 1 });
    res.send(messages);
});

app.listen(3000, () => console.log('🚀 Server ON di port 3000'));

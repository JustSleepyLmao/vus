const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Set up the public folder for static files (like login.html and style.css)
app.use(express.static('public'));
app.use(express.json()); // For parsing JSON requests

// Set up the database connection
const db = mysql.createConnection({
    host: 'sql4.webzdarma.cz',
    user: 'skoupiladria1419',
    password: 'c45r2_kQ39nZH&56*jyX',
    database: 'skoupiladria1419'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the database');
});

// Set up upload directory and Multer storage configuration
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir); // Create uploads folder if it doesn't exist
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save files to the uploads folder
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}${ext}`); // Save with a unique filename based on timestamp
    }
});

const upload = multer({ storage: storage });

// Route to serve the login page (login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route to serve the uploaded videos list (with titles)
app.get('/videos', (req, res) => {
    const sql = 'SELECT * FROM videos ORDER BY upload_date DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Failed to fetch videos:', err);
            return res.status(500).json({ message: 'Unable to fetch videos' });
        }

        res.json(results);
    });
});

// Route to handle video uploads with title
app.post('/upload', upload.single('videoFile'), (req, res) => {
    if (!req.file || !req.body.title) {
        return res.status(400).json({ message: 'No file or title uploaded' });
    }

    const videoData = {
        title: req.body.title,
        filename: req.file.filename
    };

    const sql = 'INSERT INTO videos (title, filename) VALUES (?, ?)';
    db.query(sql, [videoData.title, videoData.filename], (err, result) => {
        if (err) {
            console.error('Failed to save video data:', err);
            return res.status(500).json({ message: 'Failed to save video data' });
        }

        res.json({ message: 'Video uploaded successfully' });
    });
});

// Serve uploaded videos from the /uploads path
app.use('/uploads', express.static(uploadDir));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

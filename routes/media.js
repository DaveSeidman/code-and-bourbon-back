const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.NODE_ENV === 'production'
  ? '/var/data/media'
  : './media';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload
router.post('/upload', upload.single('file'), (req, res) => {
  console.log('Headers:', req.headers);
  console.log('File:', req.file);
  console.log('Body:', req.body);

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    filename: req.file.filename,
    url: `/api/media/${req.file.filename}`,
  });
});

// Serve
router.get('/:filename', (req, res) => {
  console.log('here')
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(path.resolve(filePath));
});

// List all
router.get('/', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  res.json(files.map(f => ({
    filename: f,
    url: `/api/media/${f}`
  })));
});

// Delete
router.delete('/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ success: true });
});

module.exports = router;
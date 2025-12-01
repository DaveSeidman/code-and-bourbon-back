const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.NODE_ENV === 'production'
  ? '/var/data/media'
  : './media';

// Ensure directory exists
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
  res.json({
    filename: req.file.filename,
    url: `/api/media/${req.file.filename}`,
  });
});

// Serve
router.get('/:filename', (req, res) => {
  res.sendFile(path.join(uploadDir, req.params.filename));
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
  fs.unlinkSync(path.join(uploadDir, req.params.filename));
  res.json({ success: true });
});

module.exports = router;
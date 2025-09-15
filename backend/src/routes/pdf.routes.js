const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadPdf, getUserPdfs, deletePdf, renamePdf, getPdfFile } = require('../controllers/pdf.controller');
const { protect } = require('../middleware/auth.middleware');

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post('/upload', protect, upload.single('pdf'), uploadPdf);
router.get('/', protect, getUserPdfs);
router.put('/:uuid', protect, renamePdf);
router.delete('/:uuid', protect, deletePdf);
router.get('/:uuid/file', protect, getPdfFile);
router.put('/:uuid',protect,renamePdf)

module.exports = router;
const express = require('express');
const router = express.Router();
const { summarizePdf } = require('../controllers/nlp.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/summarize/:pdfUuid', protect, summarizePdf);

module.exports = router;
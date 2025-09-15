const express = require('express');
const router = express.Router();
const { createHighlight, getHighlights } = require('../controllers/highlight.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/:pdfUuid', protect, createHighlight);
router.get('/:pdfUuid', protect, getHighlights);

module.exports = router;
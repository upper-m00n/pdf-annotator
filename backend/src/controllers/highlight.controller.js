const Highlight = require('../models/highlight.model');
const PDF = require('../models/pdf.model');

exports.createHighlight = async (req, res) => {
  const { pdfUuid } = req.params;
  const { content, position, pageNumber } = req.body;

  try {
   
    const pdf = await PDF.findOne({ uuid: pdfUuid, userId: req.user.id });
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found or access denied' });
    }

    const newHighlight = new Highlight({
      pdfId: pdfUuid,
      userId: req.user.id,
      content,
      position,
      pageNumber,
    });

    const savedHighlight = await newHighlight.save();
    res.status(201).json(savedHighlight);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getHighlights = async (req, res) => {
  const { pdfUuid } = req.params;

  try {
    
    const pdf = await PDF.findOne({ uuid: pdfUuid, userId: req.user.id });
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found or access denied' });
    }

    const highlights = await Highlight.find({
      pdfId: pdfUuid,
      userId: req.user.id,
    });

    res.json(highlights);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
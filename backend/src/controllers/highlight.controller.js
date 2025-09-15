const Highlight = require('../models/highlight.model');
const PDF = require('../models/pdf.model');

// create new highlight
exports.createHighlight = async (req, res) => {
  const { pdfUuid } = req.params;
  const { type, content, position, pageNumber, drawingData } = req.body;

  try {
    const pdf = await PDF.findOne({ uuid: pdfUuid, userId: req.user.id });
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found or access denied' });
    }

    if (type === 'drawing') {
      if (!drawingData) {
        return res.status(400).json({ message: 'Drawing data is required for this annotation type.' });
      }

      const drawingAnnotation = await Highlight.findOneAndUpdate(
        { pdfId: pdfUuid, userId: req.user.id, pageNumber, type: 'drawing' },
        { $set: { drawingData, pdfId: pdfUuid, userId: req.user.id, pageNumber } },
        { new: true, upsert: true } 
      );

      return res.status(200).json(drawingAnnotation);
    } 

    else if (type === 'text') {
      if (!content || !position) {
        return res.status(400).json({ message: 'Content and position are required for text highlights.' });
      }
      const newAnnotationData = {
        pdfId: pdfUuid,
        userId: req.user.id,
        pageNumber,
        type,
        content,
        position,
        note: '',
      };
      const newAnnotation = new Highlight(newAnnotationData);
      const savedAnnotation = await newAnnotation.save();
      return res.status(201).json(savedAnnotation);
    } 
    
    else {
      return res.status(400).json({ message: 'Invalid highlight type' });
    }

  } catch (error) {
    console.error("Error creating/updating annotation:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// get highlights
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

// custom note 
exports.updateHighlightNote = async (req, res) => {
  const { highlightId } = req.params;
  const { note } = req.body;

  try {
    const highlight = await Highlight.findOne({ _id: highlightId, userId: req.user.id });

    if (!highlight) {
      return res.status(404).json({ message: 'Highlight not found or access denied' });
    }

    highlight.note = note;
    const updatedHighlight = await highlight.save();
    
    res.json(updatedHighlight);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
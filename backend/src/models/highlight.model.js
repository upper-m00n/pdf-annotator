const mongoose = require('mongoose');

const HighlightSchema = new mongoose.Schema({
  pdfId: { type: String, required: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pageNumber: { type: Number, required: true }, 
  position: { 
    x1: Number, y1: Number,
    x2: Number, y2: Number,
    width: Number, height: Number,
  },
  content: { 
    text: String,
    image: String, 
  },
  note: {
    type: String,
    default: '', 
  },
  timestamp: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model('Highlight', HighlightSchema);
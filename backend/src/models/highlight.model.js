const mongoose = require('mongoose');

const HighlightSchema = new mongoose.Schema({
  pdfId: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  pageNumber: { 
    type: Number, 
    required: true 
  },
  type: {
    type: String,
    enum: ['text', 'drawing'],
    required: true,
  },
  position: {
    x1: Number,
    y1: Number,
    width: Number,
    height: Number,
  },
  content: {
    text: String,
  },
  drawingData: {
    type: String,
  },
  note: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Highlight', HighlightSchema);

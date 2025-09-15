const mongoose = require('mongoose');

const PdfSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true,
  },

  originalFilename: {
    type: String,
    required: true,
  },

  filePath: {
    type: String,
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fullText: { type: String, default: '' },
  summary: { type: String, default: '' },
  keyPhrases: [{ type: String }],
}, { timestamps: true });


const PDF = mongoose.model('PDF', PdfSchema);

module.exports = PDF;
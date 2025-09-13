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
}, { timestamps: true });


const PDF = mongoose.model('PDF', PdfSchema);

module.exports = PDF;
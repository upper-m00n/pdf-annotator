const PDF = require('../models/pdf.model');
const Highlight = require('../models/highlight.model');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');


// upload new pdf
exports.uploadPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  try {
    const newPdf = new PDF({
      uuid: uuidv4(), 
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      userId: req.user.id, 
    });

    const savedPdf = await newPdf.save(); 

    res.status(201).json({
      message: 'File uploaded successfully',
      pdf: {
        uuid: savedPdf.uuid,
        originalFilename: savedPdf.originalFilename,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// get pdf
exports.getUserPdfs = async (req, res) => {
  try {
    const pdfs = await PDF.find({ userId: req.user.id }).select('uuid originalFilename createdAt');
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// delete
exports.deletePdf = async (req, res) => {
  try {
    const pdf = await PDF.findOne({ uuid: req.params.uuid, userId: req.user.id });

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    fs.unlink(path.resolve(pdf.filePath), async (err) => {
      if (err) {
        console.error('Failed to delete file from filesystem:', err);
      }
      
      await Highlight.deleteMany({ pdfId: req.params.uuid, userId: req.user.id });
     
      await PDF.deleteOne({ _id: pdf._id });

      res.json({ message: 'PDF and associated highlights removed' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// rename
exports.renamePdf = async (req, res) => {
    try {
        const { newName } = req.body;
        if (!newName) {
            return res.status(400).json({ message: 'New name is required' });
        }

        const pdf = await PDF.findOneAndUpdate(
            { uuid: req.params.uuid, userId: req.user.id },
            { originalFilename: newName },
            { new: true } 
        );

        if (!pdf) {
            return res.status(404).json({ message: 'PDF not found or user not authorized' });
        }

        res.json({ message: 'PDF renamed successfully', pdf });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// get existing 
exports.getPdfFile = async (req, res) => {
    try {
        const pdf = await PDF.findOne({ uuid: req.params.uuid, userId: req.user.id });
        if (!pdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }
        
        const filePath = path.resolve(pdf.filePath);
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
const PDF = require('../models/pdf.model');

exports.summarizePdf = async (req, res) => {
    const { pdfUuid } = req.params;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ message: 'API key for NLP service is not configured.' });
    }

    try {
        const pdf = await PDF.findOne({ uuid: pdfUuid, userId: req.user.id });
        if (!pdf || !pdf.fullText) {
            return res.status(404).json({ message: 'PDF text content not found.' });
        }

        if (pdf.summary) { // Return cached summary if it exists
            return res.json({ summary: pdf.summary, keyPhrases: pdf.keyPhrases });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const prompt = `Summarize the following text concisely and extract the 5 most important key phrases. Here is the text:\n\n${pdf.fullText.substring(0, 15000)}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "summary": { "type": "STRING" },
                        "keyPhrases": { "type": "ARRAY", "items": { "type": "STRING" } }
                    }
                }
            }
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) throw new Error('Failed to get response from Gemini API');

        const result = await apiResponse.json();
        const parsedData = JSON.parse(result.candidates[0].content.parts[0].text);

        pdf.summary = parsedData.summary;
        pdf.keyPhrases = parsedData.keyPhrases;
        await pdf.save();

        res.json(parsedData);
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ message: 'Failed to summarize PDF.' });
    }
};
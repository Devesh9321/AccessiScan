const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const app = express();

app.use(bodyParser.json());

app.post('/generate-pdf', (req, res) => {
    const results = req.body.results;
    const doc = new PDFDocument();
    const fileName = 'accessibility-report.pdf';

    doc.pipe(fs.createWriteStream(fileName));

    doc.fontSize(20).text('Accessibility Report', { align: 'center' });
    doc.moveDown();

    results.forEach(result => {
        doc.fontSize(14).text(result.title, { underline: true });
        doc.fontSize(12).text(result.details);
        doc.moveDown();
    });

    doc.end();

    doc.on('finish', () => {
        res.download(fileName, fileName, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            fs.unlinkSync(fileName);
        });
    });
});

app.listen(3000, () => {
    console.log('Puppeteer server running on port 3000');
});

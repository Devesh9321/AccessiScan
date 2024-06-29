const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const { GridFSBucket } = require('mongodb');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

let gfs, bucket;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');

        const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        client.connect(err => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            const db = client.db('test');
            gfs = new GridFSBucket(db, { bucketName: 'pdfs' });
            bucket = db.collection('pdfs.files');
            console.log('GridFS connected');
        });
    })
    .catch(err => console.log(err));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Backend is running');
});

// PDF generation route
app.post('/generate-pdf', (req, res) => {
    const { results } = req.body;

    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);

        const uploadStream = gfs.openUploadStream('accessibility-report.pdf', {
            contentType: 'application/pdf'
        });

        uploadStream.end(pdfData, async () => {
            const pdfId = uploadStream.id;
            const fileInfo = await bucket.find({ _id: pdfId }).toArray();
            if (fileInfo && fileInfo.length > 0) {
                const downloadLink = `${req.protocol}://${req.get('host')}/download-pdf/${pdfId}`;
                res.status(200).json({ message: 'PDF generated and stored in MongoDB', downloadLink });
            } else {
                res.status(500).json({ message: 'Error storing PDF in MongoDB' });
            }
        });
    });

    doc.fontSize(25).text('Accessibility Report', { align: 'center' });

    results.forEach((result, index) => {
        doc.addPage()
            .fontSize(20)
            .text(`Result ${index + 1}`, { underline: true })
            .fontSize(12)
            .text(`URL: ${result.url}`)
            .moveDown()
            .text(`Issues:`, { underline: true });

        result.issues.forEach((issue, i) => {
            doc.text(`  ${i + 1}. ${issue}`);
        });
    });

    doc.end();
});

// Route to download PDF
app.get('/download-pdf/:id', (req, res) => {
    const pdfId = new ObjectId(req.params.id);
    gfs.openDownloadStream(pdfId).pipe(res);
});


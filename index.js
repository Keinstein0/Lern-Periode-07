const express = require('express')
const cors = require('cors')
require("dotenv").config()

const needle = require("needle")


// Define the origins you allow
const allowedOrigins = [
    'http://localhost:3000', // <-- Your frontend's development server
    'http://127.0.0.1:3000'
    // Add your production domain later: 'https://your-production-app.com'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or postman)
        // OR allow origins in the list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};


const PORT = process.env.PORT || 5000

const app = express()

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY_NAME = process.env.API_KEY_NAME;
const API_KEY_VALUE = process.env.API_KEY_VALUE;
const OCR_ENGINE =process.env.OCR_ENGINE;

app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' })) // Increase limit for large Base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.post("/api", async (req, res) => {
    const targetUrl = `${API_BASE_URL}`;

    const jsonBody = req.body;

    console.log(jsonBody)

    const formData = {
        base64Image : jsonBody.file,
        OCREngine : OCR_ENGINE,
        language : jsonBody.language,
        filetype : jsonBody.filetype
    }

    const options = {
        multipart : true,

        headers : {
            'Accept' : 'application/json',
            [API_KEY_NAME] : API_KEY_VALUE
        }
    }

    try{
        const apiResponse = await needle("post", targetUrl, formData, options)
        res.status(apiResponse.statusCode).send(apiResponse.body);
    }
    catch(error){
        res.status(500).json({
            sucess : false,
            message : "Something went wrong"
        })
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


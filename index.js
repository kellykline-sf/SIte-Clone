const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const path = require('path'); // Added for path resolution

// Debugging: Log current working Directory and all environment variables
console.log('Current Working Directory:', process.cwd());
console.log('All Process Environment Variables:', process.env);

const app = express();
const port = process.env.PORT || 3000;

// Get Tableau credentials from environment variables
const TABLEAU_CLIENT_ID = process.env.TABLEAU_CLIENT_ID;
const TABLEAU_SECRET_VALUE = process.env.TABLEAU_SECRET_VALUE;
const TABLEAU_SECRET_ID = process.env.TABLEAU_SECRET_ID;

console.log('Backend - TABLEAU_CLIENT_ID:', TABLEAU_CLIENT_ID);
console.log('Backend - TABLEAU_SECRET_VALUE:', TABLEAU_SECRET_VALUE);
console.log('Backend - TABLEAU_SECRET_ID:', TABLEAU_SECRET_ID);

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the root URL to serve the tableau-dashboard.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tableau-dashboard.html'));
});

app.post('/generate-jwt', (req, res) => {
    const { userId } = req.body; // Only userId is needed from frontend
    console.log('Backend - Received userId:', userId);

    if (!userId || !TABLEAU_CLIENT_ID || !TABLEAU_SECRET_VALUE) {
        return res.status(400).json({ error: 'Missing required parameters: userId or Tableau credentials in backend' });
    }

    const payload = {
        // iss: TABLEAU_CLIENT_ID, // Move to custom header
        // kid: TABLEAU_SECRET_ID, // Move to custom header
        jti: new Date().getTime().toString(),
        sub: userId,
        aud: 'tableau',
        scp: ['tableau:views:embed'],
        exp: Math.floor(Date.now() / 1000) + (60 * 9), // Token expires in 9 minutes (max 10 minutes for Tableau)
    };

    try {
        const customHeader = {
            alg: 'HS256',
            typ: 'JWT',
            kid: TABLEAU_SECRET_ID,
            iss: TABLEAU_CLIENT_ID
        };
        const token = jwt.sign(payload, TABLEAU_SECRET_VALUE, { header: customHeader });
        console.log('Generated JWT:', token);
        res.json({ token });
    } catch (error) {
        console.error('Error generating JWT:', error);
        res.status(500).json({ error: 'Failed to generate JWT' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});

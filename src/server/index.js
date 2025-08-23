import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { scrapeInfluencerProfile } from './scraper.js';
import channelRoutes from './routes/channels.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
  credentials: true // Allow credentials
}));

app.use(express.json());

// Routes
app.use('/api', channelRoutes);

app.post("/scrape", async (req, res) => {
  try {
    const profileUrl = req.body.url;
    
    if (!profileUrl) {
      return res.status(400).json({ error: 'Profile URL is required' });
    }

    const data = await scrapeInfluencerProfile(profileUrl);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
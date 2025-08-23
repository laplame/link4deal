import express from 'express';
import { Channel } from '../models/Channel.js';

const router = express.Router();

router.post('/channels', async (req, res) => {
  try {
    // Validate required fields
    const { channelName, subscriberCount, videoCount } = req.body;
    
    if (!channelName || !subscriberCount || !videoCount) {
      return res.status(400).json({
        error: 'Missing required fields: channelName, subscriberCount, and videoCount are required'
      });
    }

    // Create new channel document
    const channel = new Channel({
      channelName,
      subscriberCount,
      videoCount,
      videos: req.body.videos || [],
      avatarUrl: req.body.avatarUrl
    });

    // Save to database
    const savedChannel = await channel.save();

    // Return success response
    res.status(201).json({
      success: true,
      data: savedChannel
    });

  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'A channel with this name already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: error.message
      });
    }

    // Handle other errors
    console.error('Error creating channel:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
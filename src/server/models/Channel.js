import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const channelSchema = new mongoose.Schema({
  channelName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  subscriberCount: {
    type: String,
    required: true,
    trim: true
  },
  videoCount: {
    type: String,
    required: true,
    trim: true
  },
  videos: [videoSchema],
  avatarUrl: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
channelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Channel = mongoose.model('Channel', channelSchema);
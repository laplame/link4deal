import axios from 'axios';
import { Channel } from '../types';

const API_URL = 'https://damecodigo.com/api/channels';

export async function fetchChannels(): Promise<Channel[]> {
  try {
    const response = await axios.get<Channel[]>(API_URL);
    
    // Ensure we're returning a plain object that can be cloned
    return response.data.map(channel => ({
      _id: channel._id,
      channelName: channel.channelName,
      subscriberCount: channel.subscriberCount,
      videoCount: channel.videoCount,
      videos: channel.videos?.map(video => ({
        title: video.title,
        url: video.url
      })) || [],
      avatarUrl: channel.avatarUrl || '',
      createdAt: channel.createdAt ? new Date(channel.createdAt) : new Date(),
      updatedAt: channel.updatedAt ? new Date(channel.updatedAt) : new Date()
    }));
  } catch (error) {
    // Log the error for debugging
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } else {
      console.error('Error fetching channels:', error);
    }
    
    // Return an empty array instead of throwing
    // This prevents the app from breaking when the API is unavailable
    return [];
  }
}

export async function createChannel(channelData: Partial<Channel>): Promise<Channel> {
  try {
    const response = await axios.post<{ data: Channel }>(API_URL, channelData);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message);
    }
    throw new Error('Failed to create channel');
  }
}
import axios from 'axios';
import { Influencer } from '../types';

const API_URL = 'http://localhost:3001';

export async function fetchInfluencerData(url: string): Promise<Influencer | null> {
  try {
    const response = await axios.post(`${API_URL}/scrape`, { url });
    const { data } = response.data;

    // Transform the scraped data into our Influencer type
    return {
      country: "USA", // This would come from the scraped data in a real app
      name: `Influencer from ${data.platform}`,
      followers: {
        [data.platform]: data.stats.followers
      },
      segment: "Entertainment", // This would be determined by content analysis
      content: `Content creator on ${data.platform} with ${data.stats.engagement} engagement rate`,
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      socialLinks: {
        [data.platform]: data.profileUrl
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch influencer data');
  }
}
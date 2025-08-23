export interface BrandCard {
  id: string;
  name: string;
  category: string;
  subCategory: {
    en: string;
    es: string;
  };
  commission: string;
  chance: number;
  volume: string;
  image: string;
  price: {
    min: number;
    max: number;
  };
}

export interface Influencer {
  country: string;
  name: string;
  followers: {
    [key: string]: number;
  };
  segment: string;
  content: string;
  profileImage: string;
  socialLinks: {
    [key: string]: string;
  };
}

export interface Channel {
  _id?: string;
  channelName: string;
  subscriberCount: string;
  videoCount: string;
  videos?: {
    title: string;
    url: string;
  }[];
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Bid {
  id: string;
  influencerId: string;
  amount: number;
  timestamp: Date;
  bidder: string;
}

export interface AuctionHistory {
  influencerId: string;
  lastWinningBid: number;
  endDate: Date;
  smartContract: string;
}
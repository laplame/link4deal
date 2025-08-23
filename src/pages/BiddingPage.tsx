import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, DollarSign, History, AlertCircle, Info, ArrowLeft, Users, Globe, TrendingUp } from 'lucide-react';
import { influencers } from '../data/influencers';
import { useAuth } from '../context/AuthContext';
import { RealtimeBidding } from '../components/RealtimeBidding';
import { BidChart } from '../components/BidChart';
import { TokenPurchase } from '../components/TokenPurchase';
import { Bid, AuctionHistory } from '../types';

// Mock data for bids and auction history
const mockBids: Bid[] = [
  { id: '1', influencerId: 'Kendall Jenner', amount: 1000, timestamp: new Date('2024-03-01'), bidder: 'Brand A' },
  { id: '2', influencerId: 'Kendall Jenner', amount: 1500, timestamp: new Date('2024-03-02'), bidder: 'Brand B' },
  { id: '3', influencerId: 'Kendall Jenner', amount: 2000, timestamp: new Date('2024-03-03'), bidder: 'Brand C' },
  { id: '4', influencerId: 'Kendall Jenner', amount: 2500, timestamp: new Date('2024-03-04'), bidder: 'Brand D' },
];

const mockHistory: AuctionHistory[] = [
  {
    influencerId: 'Kendall Jenner',
    lastWinningBid: 5000,
    endDate: new Date('2024-03-10'),
    smartContract: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
  }
];

const mockActiveBidders = ['Brand A', 'Brand B', 'Brand C'];

// Mock metrics data
const mockMetrics = {
  mindshare: 0.85,
  impressions: 318252,
  engagement: 4316,
  followers: 50572,
  smartFollowers: 921,
  volume24h: 192530,
  marketCap: 17930000
};

export function BiddingPage() {
  const { influencerId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [currentBid, setCurrentBid] = useState('');

  const influencer = influencers.find(inf => inf.name === influencerId);

  useEffect(() => {
    if (!influencer) {
      navigate('/influencers');
      return;
    }

    // Update countdown timer
    const endDate = new Date('2024-03-10');
    const timer = setInterval(() => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Auction ended');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [influencer, navigate]);

  const handleBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBid) return;
    
    const bidAmount = parseFloat(currentBid);
    const lastBid = mockBids[mockBids.length - 1].amount;
    
    if (bidAmount <= lastBid) {
      alert('Bid must be higher than the current highest bid');
      return;
    }

    alert(`Bid placed: $${bidAmount}`);
    setCurrentBid('');
  };

  if (!influencer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/influencers" 
          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Influencers</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile and Metrics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={influencer.profileImage}
                    alt={influencer.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-white">{influencer.name}</h1>
                    <p className="text-gray-400">{influencer.segment}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Cap</span>
                    <span className="text-white font-medium">${(mockMetrics.marketCap / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Volume</span>
                    <span className="text-white font-medium">${(mockMetrics.volume24h / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 p-6 bg-gray-800/50">
                <div>
                  <div className="text-sm text-gray-400">Mindshare</div>
                  <div className="text-lg font-medium text-white">{(mockMetrics.mindshare * 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Impressions</div>
                  <div className="text-lg font-medium text-white">{mockMetrics.impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Engagement</div>
                  <div className="text-lg font-medium text-white">{mockMetrics.engagement.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Followers</div>
                  <div className="text-lg font-medium text-white">{mockMetrics.followers.toLocaleString()}</div>
                </div>
              </div>

              {/* Social Links */}
              <div className="p-6 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Social Links</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(influencer.socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm text-gray-300"
                    >
                      <Globe className="h-4 w-4" />
                      <span>{platform}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bidding and Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auction Status */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <span className="text-gray-400">Time Remaining</span>
                  </div>
                  <div className="text-xl font-mono text-white">{timeLeft}</div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <span className="text-gray-400">Current Bid</span>
                  </div>
                  <div className="text-xl font-mono text-green-400">
                    ${mockBids[mockBids.length - 1].amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Bid Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Bid History</h2>
                </div>
                <div className="relative group">
                  <Info className="h-5 w-5 text-gray-400 cursor-help" />
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 invisible group-hover:visible z-50">
                    <p className="text-sm text-gray-300">
                      Smart Contract: {mockHistory[0].smartContract}
                      <br />
                      Blockchain: Polygon Protocol
                    </p>
                  </div>
                </div>
              </div>
              <BidChart bids={mockBids} />
            </div>

            {/* Active Bidders */}
            <RealtimeBidding activeBidders={mockActiveBidders} />

            {/* Place Bid Form */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <form onSubmit={handleBid} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Bid Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={currentBid}
                      onChange={(e) => setCurrentBid(e.target.value)}
                      min={mockBids[mockBids.length - 1].amount + 1}
                      step="0.01"
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter bid amount"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Place Bid</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
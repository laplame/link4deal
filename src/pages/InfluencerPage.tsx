import React, { useState, useEffect } from 'react';
import { Search, Filter, Globe, Users, Plus, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { InfluencerCard } from '../components/InfluencerCard';
import { NavigationHeader } from '../components/navigation/NavigationHeader';
import { influencers } from '../data/influencers';
import { fetchChannels } from '../services/channels';
import { Channel, Influencer } from '../types';

export function InfluencerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setError(null);
        const fetchedChannels = await fetchChannels();
        setChannels(fetchedChannels);
      } catch (err) {
        setError('Failed to load channels. Please try again later.');
        console.error('Error loading channels:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  // Convert channels to Influencer format
  const channelInfluencers: Influencer[] = channels.map(channel => ({
    country: 'Unknown',
    name: channel.channelName,
    followers: {
      YouTube: parseInt(channel.subscriberCount.replace(/[^0-9]/g, ''), 10) || 0
    },
    segment: 'Content Creator',
    content: `Created ${channel.videoCount} videos`,
    profileImage: channel.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    socialLinks: {
      YouTube: channel.videos?.[0]?.url || '#'
    }
  }));

  // Combine local influencers with channel influencers
  const allInfluencers = [...influencers, ...channelInfluencers];

  const filteredInfluencers = allInfluencers.filter(influencer => {
    const matchesSearch = influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = selectedCountry === 'all' || influencer.country === selectedCountry;
    const matchesSegment = selectedSegment === 'all' || influencer.segment === selectedSegment;
    
    return matchesSearch && matchesCountry && matchesSegment;
  });

  const countries = Array.from(new Set(allInfluencers.map(inf => inf.country)));
  const segments = Array.from(new Set(allInfluencers.map(inf => inf.segment)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading influencers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <NavigationHeader title="Top Influencers" />

      <div className="container mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search influencers, segments, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full sm:w-auto bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="all">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full sm:w-auto bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="all">All Segments</option>
                {segments.map(segment => (
                  <option key={segment} value={segment}>{segment}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInfluencers.map(influencer => (
              <InfluencerCard 
                key={influencer.name} 
                influencer={influencer} 
                viewMode="influencers" 
              />
            ))}
          </div>

          {filteredInfluencers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400">No influencers found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
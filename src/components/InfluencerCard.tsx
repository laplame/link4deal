import React from 'react';
import { Globe, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Influencer } from '../types';

interface Props {
  influencer: Influencer;
  viewMode: 'influencers' | 'market';
}

export function InfluencerCard({ influencer, viewMode }: Props) {
  const totalFollowers = Object.values(influencer.followers).reduce((a, b) => a + b, 0);
  const formattedFollowers = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all">
      <div className="relative h-48">
        <img
          src={influencer.profileImage}
          alt={influencer.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent">
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {influencer.segment}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{influencer.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Globe className="h-4 w-4" />
              <span>{influencer.country}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-purple-500/10 px-3 py-1 rounded-full">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              {formattedFollowers(totalFollowers)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {Object.entries(influencer.followers).map(([platform, count]) => (
            <div key={platform} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{platform}</span>
              <span className="text-sm font-medium text-white">
                {formattedFollowers(count)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {influencer.content}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(influencer.socialLinks).map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm text-gray-300"
            >
              <span>{platform}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>

        <Link
          to={`/bids/${influencer.name}`}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <span>See Bids</span>
          <TrendingUp className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
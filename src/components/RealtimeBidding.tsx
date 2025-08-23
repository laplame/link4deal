import React from 'react';
import { Users, Info } from 'lucide-react';

interface Props {
  activeBidders: string[];
}

export function RealtimeBidding({ activeBidders }: Props) {
  return (
    <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-purple-400" />
          <h3 className="text-white font-medium">Active Bidders</h3>
        </div>
        <div className="relative group">
          <Info className="h-5 w-5 text-gray-400 cursor-help" />
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 invisible group-hover:visible z-50">
            <p className="text-sm text-gray-300">
              Only verified brands and the influencer can see the real-time auctions
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {activeBidders.map((bidder, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 text-sm"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-300">{bidder}</span>
            {bidder === 'Brand A' && (
              <span className="text-xs text-gray-500 italic">
                (viewing)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
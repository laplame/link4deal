import React from 'react';
import { Star, ChevronRight, Percent, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandCard as BrandCardType } from '../types';

interface Props {
  brand: BrandCardType;
}

export function BrandCard({ brand }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all">
      <div className="relative h-48">
        <img
          src={brand.image}
          alt={brand.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent">
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {brand.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {brand.subCategory.en}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{brand.name}</h3>
          <div className="flex items-center space-x-1 text-gray-400">
            <Star className="h-4 w-4" />
            <span className="text-sm">4.8</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Percent className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-medium">{brand.commission}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">
              ${brand.price.min}-${brand.price.max}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          Vol: {brand.volume}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Acceptance Rate</span>
              <span className="text-sm font-medium text-white">{brand.chance}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-400 rounded-full h-2 transition-all"
                style={{ width: `${brand.chance}%` }}
              />
            </div>
          </div>
        </div>

        <Link
          to={`/promotion/${brand.id}`}
          className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <span>Apply Now</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
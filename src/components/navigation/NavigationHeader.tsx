import React, { useState } from 'react';
import { Users, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileMenu } from './MobileMenu';
import { SITE_CONFIG } from '../../config/site';

interface Props {
  title?: string;
}

export function NavigationHeader({ title }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="h-6 w-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white">
              {title || SITE_CONFIG.name}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <Link 
                to="/brands"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Building2 className="h-4 w-4" />
                <span>View Brand Opportunities</span>
              </Link>
              
              <Link 
                to="/add-influencer"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Become an Influencer
              </Link>
              
              <Link 
                to="/add-influencer-quick"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Influencer
              </Link>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, TrendingUp } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

export default function UserSelectorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">{SITE_CONFIG.name}</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Connect brands with influencers. Create meaningful partnerships that drive results.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link to="/brands" className="group">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-blue-500 transition-all">
              <Building2 className="h-12 w-12 text-blue-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">I'm a Brand</h2>
              <p className="text-gray-400 mb-6">
                Find the perfect influencers to promote your products and services.
                Connect with creators who share your values.
              </p>
              <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                Explore Brand Opportunities →
              </span>
            </div>
          </Link>

          <Link to="/influencers" className="group">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition-all">
              <Users className="h-12 w-12 text-purple-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">I'm an Influencer</h2>
              <p className="text-gray-400 mb-6">
                Discover brands that match your style and values. Monetize your audience
                with authentic partnerships.
              </p>
              <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                View Influencer Programs →
              </span>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="bg-blue-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Data-Driven Matches</h3>
            <p className="text-gray-400">Find partnerships that align with your goals and audience demographics.</p>
          </div>
          <div className="p-6">
            <div className="bg-purple-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Verified Partners</h3>
            <p className="text-gray-400">Work with pre-vetted brands and influencers you can trust.</p>
          </div>
          <div className="p-6">
            <div className="bg-green-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure Payments</h3>
            <p className="text-gray-400">Manage contracts and payments safely through our platform.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

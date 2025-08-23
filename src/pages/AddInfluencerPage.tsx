import React, { useState } from 'react';
import { Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AddInfluencerPage() {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    segment: '',
    content: '',
    platforms: {
      instagram: '',
      youtube: '',
      tiktok: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'influencer',
          data: formData
        })
      });
      
      if (response.ok) {
        alert('Influencer added successfully!');
      } else {
        throw new Error('Failed to add influencer');
      }
    } catch (error) {
      alert('Error adding influencer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link to="/influencers" className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Influencers</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Users className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Become an Influencer</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country
              </label>
              <select
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a country</option>
                <option value="USA">USA</option>
                <option value="Mexico">Mexico</option>
                <option value="Colombia">Colombia</option>
                <option value="Russia">Russia</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="Japan">Japan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Segment
              </label>
              <select
                required
                value={formData.segment}
                onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a segment</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Fashion & Beauty">Fashion & Beauty</option>
                <option value="Travel">Travel</option>
                <option value="Sports">Sports</option>
                <option value="Gaming">Gaming</option>
                <option value="Music">Music</option>
                <option value="Comedy">Comedy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Description
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
                placeholder="Describe your content and style..."
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Social Media Handles
              </label>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Instagram</label>
                <input
                  type="text"
                  value={formData.platforms.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    platforms: { ...formData.platforms, instagram: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">YouTube</label>
                <input
                  type="text"
                  value={formData.platforms.youtube}
                  onChange={(e) => setFormData({
                    ...formData,
                    platforms: { ...formData.platforms, youtube: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Channel URL"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">TikTok</label>
                <input
                  type="text"
                  value={formData.platforms.tiktok}
                  onChange={(e) => setFormData({
                    ...formData,
                    platforms: { ...formData.platforms, tiktok: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="@username"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { SocialMediaInput } from '../components/forms/SocialMediaInput';
import { LoadingButton } from '../components/forms/LoadingButton';
import { fetchInfluencerData } from '../services/influencer';

export function AddInfluencerQuick() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);

    try {
      const influencer = await fetchInfluencerData(url);
      if (influencer) {
        // In a real app, you would save this to your backend
        console.log('Influencer data:', influencer);
        navigate('/influencers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch influencer data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/influencers" 
          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Influencers</span>
        </Link>

        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Users className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Quick Add Influencer</h1>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <SocialMediaInput
                value={url}
                onChange={setUrl}
                error={error}
              />

              <LoadingButton
                type="submit"
                loading={loading}
                disabled={!url}
              >
                Add Influencer
              </LoadingButton>
            </form>

            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium text-white">Supported Platforms</h3>
              <div className="grid grid-cols-3 gap-4">
                {['Instagram', 'YouTube', 'TikTok'].map((platform) => (
                  <div
                    key={platform}
                    className="bg-gray-700/50 rounded-lg p-3 text-center"
                  >
                    <span className="text-sm text-gray-300">{platform}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">Quick Add Tips</h4>
                    <ul className="mt-2 text-sm text-gray-400 space-y-1">
                      <li>• Use the full profile URL from supported platforms</li>
                      <li>• Ensure the profile is public</li>
                      <li>• Data will be automatically fetched and validated</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
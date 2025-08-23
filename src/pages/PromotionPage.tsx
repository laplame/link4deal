import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QrCode, Share2, Phone, AlertCircle } from 'lucide-react';
import { brands } from '../data/brands';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';

export function PromotionPage() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  const brand = brands.find(b => b.id === brandId);
  
  useEffect(() => {
    if (!brand) {
      navigate('/brands');
      return;
    }

    const generateQR = async () => {
      try {
        const url = window.location.href;
        const qr = await QRCode.toDataURL(url);
        setQrCode(qr);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [brand, navigate]);

  if (!brand) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">
            You need to be registered as an influencer to view and apply for this promotion.
          </p>
          <Link
            to="/add-influencer"
            className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Register as Influencer
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brand.name} Promotion`,
          text: `Check out this amazing offer from ${brand.name}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Influencer Info */}
        {currentUser && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 flex items-center space-x-4">
            <img
              src={currentUser.profileImage}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="font-medium text-white">{currentUser.name}</h3>
              <p className="text-sm text-gray-400">{currentUser.segment}</p>
            </div>
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
            <img
              src={brand.image}
              alt={brand.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold mb-2">{brand.name}</h1>
          <p className="text-gray-400">{brand.category} - {brand.subCategory.en}</p>
        </div>

        {/* Promotion Card */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-400 font-semibold">
              {brand.commission} Commission
            </span>
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm">
              {brand.chance}% Acceptance Rate
            </span>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-3xl font-bold mb-2">
              ${brand.price.min} - ${brand.price.max}
            </div>
            <p className="text-gray-400">Potential Earnings Range</p>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-semibold mb-2">Requirements:</h3>
            <ul className="text-gray-400 space-y-2">
              <li>• Minimum follower count: 10k</li>
              <li>• Active engagement rate</li>
              <li>• Content aligned with brand values</li>
            </ul>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
          <QrCode className="h-8 w-8 mx-auto mb-4 text-blue-400" />
          {qrCode && (
            <img
              src={qrCode}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-4"
            />
          )}
          <p className="text-gray-400 text-sm">
            Scan to share this promotion
          </p>
        </div>

        {/* Contact Button */}
        <button
          onClick={handleShare}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 mb-4"
        >
          <Share2 className="h-5 w-5" />
          <span>{copied ? 'Copied!' : 'Share Promotion'}</span>
        </button>

        <a
          href={`tel:+1234567890`}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Phone className="h-5 w-5" />
          <span>Contact Support</span>
        </a>
      </div>
    </div>
  );
}
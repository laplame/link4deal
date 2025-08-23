import React, { useState } from 'react';
import { Coins, AlertCircle } from 'lucide-react';
import { AuctionHistory } from '../types';

interface Props {
  lastAuction: AuctionHistory;
}

export function TokenPurchase({ lastAuction }: Props) {
  const [tokenAmount, setTokenAmount] = useState('10'); // Default to minimum 10%
  const tokenPrice = lastAuction.lastWinningBid / 100; // Price per 1% of tokens
  const totalCost = parseFloat(tokenAmount) * tokenPrice;

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(tokenAmount);
    
    if (amount < 10) {
      alert('Minimum token purchase is 10%');
      return;
    }

    if (amount > 100) {
      alert('Maximum token purchase is 100%');
      return;
    }

    // Here you would integrate with your blockchain contract
    alert(`Purchase confirmed! ${amount}% tokens for $${totalCost.toFixed(2)}`);
  };

  return (
    <div className="p-6 border-b border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">Token Purchase</h2>
        </div>
        <div className="relative group">
          <AlertCircle className="h-5 w-5 text-gray-400 cursor-help" />
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 invisible group-hover:visible z-50">
            <p className="text-sm text-gray-300">
              You must purchase at least 10% of the tokens from the last winning bid
              to participate in the current auction.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Last Winning Bid:</span>
          <span className="text-white font-medium">${lastAuction.lastWinningBid}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Price per 1% Token:</span>
          <span className="text-white font-medium">${tokenPrice.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handlePurchase} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Token Percentage to Purchase
          </label>
          <div className="relative">
            <input
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              min="10"
              max="100"
              step="1"
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Total Cost:</span>
            <span className="text-white font-medium">${totalCost.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">
            This will give you {tokenAmount}% ownership of the last auction's tokens
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Coins className="h-5 w-5" />
          <span>Purchase Tokens</span>
        </button>
      </form>
    </div>
  );
}
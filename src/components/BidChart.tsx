import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Bid } from '../types';

interface Props {
  bids: Bid[];
}

export function BidChart({ bids }: Props) {
  const data = bids.map(bid => ({
    timestamp: new Date(bid.timestamp).getTime(),
    amount: bid.amount,
  })).sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
            stroke="#6B7280"
          />
          <YAxis
            stroke="#6B7280"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-white font-medium">
                      ${payload[0].value}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(payload[0].payload.timestamp).toLocaleString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#8B5CF6"
            fillOpacity={1}
            fill="url(#bidGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
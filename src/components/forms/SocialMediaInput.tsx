import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function SocialMediaInput({ value, onChange, error }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Social Media Profile URL
      </label>
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-gray-800 border ${error ? 'border-red-500' : 'border-gray-700'} rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500`}
          placeholder="https://instagram.com/username"
        />
        {error && (
          <div className="absolute right-0 top-0 h-full flex items-center pr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function LoadingButton({ loading, children, onClick, type = 'button', disabled }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${loading ? 'cursor-wait' : ''}`}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      <span>{children}</span>
    </button>
  );
}
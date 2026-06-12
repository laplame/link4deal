import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}

export function MobileMenuButton({ to, onClick, children }: Props) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex w-full min-h-[44px] items-center px-4 py-3 text-white font-medium bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors duration-200 text-left"
    >
      {children}
    </Link>
  );
}
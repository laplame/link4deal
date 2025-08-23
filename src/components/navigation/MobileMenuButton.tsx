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
      className="block w-full min-h-[44px] px-4 py-3 text-white font-medium bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg transition-colors duration-200 text-center"
    >
      {children}
    </Link>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe, DollarSign } from 'lucide-react';

export interface RegisteredBrand {
  _id: string;
  companyName: string;
  industry?: string;
  website?: string;
  description?: string;
  headquarters?: string;
  marketingBudget?: { min?: number; max?: number; currency?: string };
  categories?: string[];
  status?: string;
  createdAt?: string;
}

interface Props {
  brand: RegisteredBrand;
}

export function RegisteredBrandCard({ brand }: Props) {
  const navigate = useNavigate();
  const budget = brand.marketingBudget;
  const hasBudget = budget && (Number(budget.min) > 0 || Number(budget.max) > 0);
  const budgetLabel = hasBudget
    ? `$${Number(budget?.min || 0)} - $${Number(budget?.max || 0)} ${budget?.currency || 'USD'}`
    : null;

  const goToProfile = () => {
    navigate(`/brand/${brand._id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToProfile();
        }
      }}
      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500/50 hover:ring-1 hover:ring-blue-500/30 transition-all p-4 cursor-pointer text-left"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white truncate">{brand.companyName}</h3>
          {brand.industry && (
            <p className="text-sm text-gray-400 mt-0.5">{brand.industry}</p>
          )}
          {brand.website && (
            <a
              href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-1"
            >
              <Globe className="h-4 w-4" />
              <span className="truncate">{brand.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {brand.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{brand.description}</p>
          )}
          {hasBudget && budgetLabel && (
            <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
              <DollarSign className="h-4 w-4" />
              <span>{budgetLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

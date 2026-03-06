import React from 'react';
import { Building2, Globe, DollarSign } from 'lucide-react';

export interface RegisteredBrand {
  _id: string;
  companyName: string;
  industry?: string;
  website?: string;
  description?: string;
  marketingBudget?: { min?: number; max?: number; currency?: string };
  categories?: string[];
  status?: string;
  createdAt?: string;
}

interface Props {
  brand: RegisteredBrand;
}

export function RegisteredBrandCard({ brand }: Props) {
  const budget = brand.marketingBudget;
  const hasBudget = budget && (Number(budget.min) > 0 || Number(budget.max) > 0);
  const budgetLabel = hasBudget
    ? `$${Number(budget?.min || 0)} - $${Number(budget?.max || 0)} ${budget?.currency || 'USD'}`
    : null;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all p-4">
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

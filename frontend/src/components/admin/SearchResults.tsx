import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingCart,
  ChefHat,
  Settings,
  PackageSearch,
  AlertCircle
} from 'lucide-react';
import type { SearchResult } from '@/utils/adminSearch';

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  onSelect: () => void;
}

export function SearchResults({ results, loading, error, onSelect }: SearchResultsProps) {
  const navigate = useNavigate();

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'food':
        return <ChefHat className="h-4 w-4" />;
      case 'setting':
        return <Settings className="h-4 w-4" />;
      default:
        return <PackageSearch className="h-4 w-4" />;
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect();
    navigate(result.link);
  };

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
        <div className="px-4 py-2 text-sm text-gray-500">
          Searching...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
        <div className="px-4 py-2 text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
        <div className="px-4 py-2 text-sm text-gray-500">
          No results found
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
      {results.map((result) => (
        <button
          key={`${result.type}-${result.id}`}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
          onClick={() => handleSelect(result)}
        >
          <div className="text-gray-500 dark:text-gray-400">
            {getIcon(result.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {result.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {result.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
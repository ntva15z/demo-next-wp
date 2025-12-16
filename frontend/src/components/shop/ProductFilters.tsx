'use client';

import { useState } from 'react';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterSection {
  id: string;
  title: string;
  type: 'checkbox' | 'radio' | 'range';
  options: FilterOption[];
  expanded?: boolean;
}

interface ProductFiltersProps {
  filters: FilterSection[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  onClearAll: () => void;
}

export default function ProductFilters({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    filters.reduce((acc, f) => ({ ...acc, [f.id]: f.expanded !== false }), {})
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleCheckboxChange = (filterId: string, optionId: string, checked: boolean) => {
    const current = selectedFilters[filterId] || [];
    const updated = checked
      ? [...current, optionId]
      : current.filter((id) => id !== optionId);
    onFilterChange(filterId, updated);
  };

  const hasActiveFilters = Object.values(selectedFilters).some((arr) => arr.length > 0);

  return (
    <div className="w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-[#0d4f4f] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(selectedFilters).map(([filterId, values]) =>
            values.map((value) => {
              const filter = filters.find((f) => f.id === filterId);
              const option = filter?.options.find((o) => o.id === value);
              return (
                <span
                  key={`${filterId}-${value}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {option?.label || value}
                  <button
                    onClick={() => handleCheckboxChange(filterId, value, false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })
          )}
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-6">
        {filters.map((section) => (
          <div key={section.id} className="border-b border-gray-200 pb-6">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="font-medium text-gray-900">{section.title}</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  expandedSections[section.id] ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections[section.id] && (
              <div className="mt-4 space-y-3">
                {section.options.slice(0, 6).map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={(selectedFilters[section.id] || []).includes(option.id)}
                      onChange={(e) =>
                        handleCheckboxChange(section.id, option.id, e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#0d4f4f] focus:ring-[#0d4f4f]"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-400">({option.count})</span>
                    )}
                  </label>
                ))}
                {section.options.length > 6 && (
                  <button className="text-sm text-[#0d4f4f] hover:underline">
                    + {section.options.length - 6} more
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

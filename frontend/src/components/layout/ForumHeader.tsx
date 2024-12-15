import React, { useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export const ForumHeader = ({ 
  totalThreads, 
  currentSection,
  onSearch = (criteria) => console.log('Search:', criteria)
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState('title');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({
      type: searchType,
      query: searchQuery,
      section: currentSection
    });
  };

  return (
    <div className="bg-white border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Section Info */}
          <div className="flex items-center space-x-4">
            <h2 className="text-lg text-black font-semibold capitalize">
              {currentSection} Discussion
            </h2>
            <span className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded-full">
              {totalThreads} threads
            </span>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-gray-50 rounded-lg border"
          >
            <Search className="w-4 h-4 text-white" />
            <span>Search</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Search Panel */}
        {isSearchOpen && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search forum..."
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="p-2 border rounded-lg bg-black focus:ring-2 focus:ring-blue-500"
                >
                  <option value="title">Search in Titles</option>
                  <option value="content">Search in Content</option>
                  <option value="user">Search by User</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Search Tips */}
              <div className="text-sm text-gray-500">
                Search tips:
                <ul className="list-disc list-inside ml-2">
                  <li>Use quotes for exact phrases: "drone racing"</li>
                  <li>User search supports partial names</li>
                  <li>Results are limited to current section: {currentSection}</li>
                </ul>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

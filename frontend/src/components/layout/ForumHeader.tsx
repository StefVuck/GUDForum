import React, { useState } from 'react';
import { Search, ChevronDown, X, Filter, Calendar, Clock, PlusCircle, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../forum/NotificationBell';
import { useLocation } from 'react-router-dom';

type SearchCriteria = {
  type: string;
  query: string;
  section: string;
  dateRange?: string;
  hasReplies?: boolean;
  isResolved?: boolean;
  tags?: string[];
  sortBy?: string;
  teamFilter?: string;
};

interface ForumHeaderProps {
  totalThreads?: number;
  currentSection?: string;
  onSearch?: (criteria: SearchCriteria) => Promise<void>;
  isSearchActive?: boolean;
  onClearSearch?: () => void;
  setIsCreateModalOpen?: (open: boolean) => void;
  pageTitle?: string;
  userName?: string;
}

export const ForumHeader = ({ 
  totalThreads, 
  currentSection,
  onSearch,
  isSearchActive,
  onClearSearch,
  setIsCreateModalOpen,
  pageTitle,
  userName,
}: ForumHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const location = useLocation();
  
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    type: 'title',
    query: '',
    section: '',
    dateRange: 'all',
    hasReplies: false,
    isResolved: false,
    tags: [],
    sortBy: 'recent',
    teamFilter: 'all'
  });

  const isProfilePage = location.pathname.includes('/profile') || location.pathname.includes('/users/');
  const isThreadPage = location.pathname.includes('/thread/');

  const teamOptions = [
    { value: 'all', label: 'All Teams' },
    { value: 'software', label: 'Software Team' },
    { value: 'hardware', label: 'Hardware Team' },
    { value: 'pilots', label: 'Pilot Team' },
    { value: 'design', label: 'Design Team' }
  ];

  const tagOptions = [
    'Competition', 'Technical', 'Question', 'Hardware', 'Software',
    'Firmware', 'Racing', 'Safety', 'Maintenance', 'Events'
  ];
  // Render different headers based on the current page
  const renderHeaderContent = () => {
    if (isProfilePage) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <User className="w-6 h-6 text-black gap-2 rounded-lg" />
            <h2 className="text-lg text-black font-semibold">
              {userName ? `${userName}'s Profile` : 'User Profile'}
            </h2>
          </div>
        </div>
      );
    }

    if (isThreadPage) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center text-black space-x-4">
            <MessageSquare className="w-6 h-6" />
            <h2 className="text-lg text-black font-semibold">
              {pageTitle || 'Thread View'}
            </h2>
          </div>
        </div>
      );
    }

    // Default forum view header
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isSearchActive ? (
              <span className="text-lg text-black font-semibold">Search Results</span>
            ) : (
              <span className="text-lg text-black font-semibold capitalize">
                {currentSection} Discussion
              </span>
            )}
            {totalThreads !== undefined && (
              <span className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded-full">
                {totalThreads} threads
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {setIsCreateModalOpen && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Thread</span>
              </button>
            )}

            {onSearch && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="flex items-center gap-2 px-4 py-2 text-white hover:bg-gray-900 rounded-lg border"
              >
                <Search className="w-4 h-4 text-white" />
                <span>Search</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Search Panel */}
        {isSearchOpen && onSearch &&(
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <form onSubmit={(e) => {
              e.preventDefault();
              onSearch(searchCriteria);
            }} className="space-y-4">
              {/* Basic Search */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchCriteria.query}
                    onChange={(e) => setSearchCriteria({
                      ...searchCriteria,
                      query: e.target.value
                    })}
                    placeholder="Search forum..."
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-gray-200 text-black"
                  />
                </div>
                <select
                  value={searchCriteria.type}
                  onChange={(e) => setSearchCriteria({
                    ...searchCriteria,
                    type: e.target.value
                  })}
                  className="p-2 border rounded-lg bg-gray-200 focus:ring-2 text-black focus:ring-blue-500"
                >
                  <option value="title">Search in Titles</option>
                  <option value="content">Search in Content</option>
                  <option value="user">Search by User</option>
                  <option value="tags">Search by Tags</option>
                </select>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Filter className="w-4 h-4" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </button>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <select
                      value={searchCriteria.dateRange}
                      onChange={(e) => setSearchCriteria({
                        ...searchCriteria,
                        dateRange: e.target.value
                      })}
                      className="w-full p-2 border rounded bg-gray-200 text-black"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                      <option value="semester">This Semester</option>
                    </select>
                  </div>

                  {/* Team Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team
                    </label>
                    <select
                      value={searchCriteria.teamFilter}
                      onChange={(e) => setSearchCriteria({
                        ...searchCriteria,
                        teamFilter: e.target.value
                      })}
                      className="w-full p-2 border rounded bg-gray-200 text-black"
                    >
                      {teamOptions.map(team => (
                        <option key={team.value} value={team.value}>
                          {team.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const tags = searchCriteria.tags || [];
                            setSearchCriteria({
                              ...searchCriteria,
                              tags: tags.includes(tag)
                                ? tags.filter(t => t !== tag)
                                : [...tags, tag]
                            });
                          }}
                          className={`px-2 py-1 rounded text-sm ${
                            searchCriteria.tags?.includes(tag)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Filters */}
                  <div className="col-span-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchCriteria.hasReplies}
                        onChange={(e) => setSearchCriteria({
                          ...searchCriteria,
                          hasReplies: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Has replies</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchCriteria.isResolved}
                        onChange={(e) => setSearchCriteria({
                          ...searchCriteria,
                          isResolved: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Resolved threads only</span>
                    </label>
                  </div>

                  {/* Sort Options */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={searchCriteria.sortBy}
                      onChange={(e) => setSearchCriteria({
                        ...searchCriteria,
                        sortBy: e.target.value
                      })}
                      className="w-full p-2 border rounded bg-gray-200 text-black"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="relevant">Most Relevant</option>
                      <option value="replies">Most Replies</option>
                      <option value="views">Most Viewed</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchCriteria({
                      type: 'title',
                      query: '',
                      section: currentSection,
                      dateRange: 'all',
                      hasReplies: false,
                      isResolved: false,
                      tags: [],
                      sortBy: 'recent',
                      teamFilter: 'all'
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-800 text-white rounded"
                >
                  Reset
                </button>
                {isSearchActive && (
              <button
                onClick={onClearSearch}
                className="gap-2 px-4 py-2 rounded text-sm bg-red-700 text-white hover:text-gray-800"
              >
                Clear Search
              </button>
            )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        )}
      </>
  );
  };

  return (
    <div className="bg-white border-b">
      <div className="px-6 py-4">
        {renderHeaderContent()}
      </div>
    </div>
  );
};


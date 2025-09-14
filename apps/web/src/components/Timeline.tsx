'use client';

import React, { useState, useMemo } from 'react';
import { Memory } from '@our-line-in-time/shared';
import { formatDate } from '@our-line-in-time/shared';
import { Calendar, MapPin, Users, Image, Filter, SortAsc, SortDesc } from 'lucide-react';

interface TimelineProps {
  memories: Memory[];
  onMemoryClick?: (memory: Memory) => void;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'location';
type FilterOption = 'all' | 'photos' | 'public' | 'family' | 'private';

export function Timeline({ memories, onMemoryClick, className = '' }: TimelineProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedMemories = useMemo(() => {
    let filtered = memories;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        memory =>
          memory.title.toLowerCase().includes(search) ||
          memory.narrative.toLowerCase().includes(search) ||
          memory.locationName.toLowerCase().includes(search) ||
          memory.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'photos':
          filtered = filtered.filter(memory => memory.mediaItems.length > 0);
          break;
        case 'public':
        case 'family':
        case 'private':
          filtered = filtered.filter(memory => memory.privacyLevel === filterBy);
          break;
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'oldest':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'location':
          return a.locationName.localeCompare(b.locationName);
        default:
          return 0;
      }
    });

    return sorted;
  }, [memories, sortBy, filterBy, searchTerm]);

  const groupedMemories = useMemo(() => {
    const groups: { [key: string]: Memory[] } = {};

    filteredAndSortedMemories.forEach(memory => {
      const date = new Date(memory.startDate);
      const groupKey = sortBy === 'location'
        ? memory.locationName
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(memory);
    });

    return groups;
  }, [filteredAndSortedMemories, sortBy]);

  const getGroupTitle = (groupKey: string) => {
    if (sortBy === 'location') {
      return groupKey;
    }

    const [year, month] = groupKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getPrivacyIcon = (level: string) => {
    const iconClass = "h-3 w-3";
    switch (level) {
      case 'public': return <div className={`${iconClass} bg-green-500 rounded-full`} title="Public" />;
      case 'family': return <div className={`${iconClass} bg-blue-500 rounded-full`} title="Family" />;
      case 'private': return <div className={`${iconClass} bg-gray-500 rounded-full`} title="Private" />;
      default: return null;
    }
  };

  if (memories.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No memories yet</h3>
        <p className="text-gray-500">Start by creating your first memory to see your timeline.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="location">By location</option>
          </select>

          {/* Filter dropdown */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All memories</option>
            <option value="photos">With photos</option>
            <option value="public">Public</option>
            <option value="family">Family</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {filteredAndSortedMemories.length} of {memories.length} memories
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedMemories).map(([groupKey, groupMemories]) => (
          <div key={groupKey} className="space-y-4">
            {/* Group header */}
            <div className="sticky top-0 bg-white py-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {getGroupTitle(groupKey)}
              </h3>
              <p className="text-sm text-gray-500">
                {groupMemories.length} {groupMemories.length === 1 ? 'memory' : 'memories'}
              </p>
            </div>

            {/* Memory cards */}
            <div className="space-y-4">
              {groupMemories.map((memory) => (
                <div
                  key={memory.id}
                  onClick={() => onMemoryClick?.(memory)}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-1">
                          {memory.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(new Date(memory.startDate))}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{memory.locationName}</span>
                          </div>
                          {memory.familyMembers.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{memory.familyMembers.length}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {memory.mediaItems.length > 0 && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Image className="h-4 w-4" />
                            <span>{memory.mediaItems.length}</span>
                          </div>
                        )}
                        {getPrivacyIcon(memory.privacyLevel)}
                      </div>
                    </div>

                    {/* Content */}
                    {memory.narrative && (
                      <p className="text-gray-700 mb-3 line-clamp-3">
                        {memory.narrative}
                      </p>
                    )}

                    {/* Tags */}
                    {memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {memory.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {memory.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{memory.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Media preview */}
                    {memory.mediaItems.length > 0 && (
                      <div className="flex space-x-2 overflow-x-auto">
                        {memory.mediaItems.slice(0, 4).map((mediaItem, index) => (
                          <div
                            key={mediaItem.id}
                            className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"
                          >
                            {mediaItem.mimeType.startsWith('image/') ? (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <Image className="h-6 w-6 text-gray-400" />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  {mediaItem.mimeType.split('/')[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {memory.mediaItems.length > 4 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              +{memory.mediaItems.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedMemories.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No memories found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
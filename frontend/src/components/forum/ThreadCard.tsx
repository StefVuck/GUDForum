import React from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { MarkdownContent } from '../common/MarkdownContent';
import type { Thread } from '../../types';

type ThreadCardProps = {
  thread: Thread;
  onThreadClick: (threadId: number) => void;
}

export const ThreadCard = ({ thread, onThreadClick }: ThreadCardProps) => {
  return (
    <div 
      onClick={() => onThreadClick(thread.ID)}
      className="bg-white rounded-lg shadow p-4 mb-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="text-lg text-black font-semibold mb-2">{thread.title}</h3>
      
      {/* Preview content with max height and fade out effect */}
      <div className="relative mb-4 max-h-24 overflow-hidden">
        <MarkdownContent 
          content={thread.content} 
          className="text-black text-sm prose-sm"
        />
        {/* Gradient fade for overflow content */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {thread.Replies?.length || 0} replies
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(thread.CreatedAt).toLocaleDateString()}
          </span>
        </div>
        <span>by {thread.User?.name || 'Anonymous'}</span>
      </div>
    </div>
  );
};

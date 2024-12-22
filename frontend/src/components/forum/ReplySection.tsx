import React, { useState } from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import type { Thread } from '../../types';

type ReplySectionProps = {
  thread: Thread;
  onReplySubmit: (content: string) => void;
}

export const ReplySection = ({ thread, onReplySubmit }: ReplySectionProps) => {
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = () => {
    if (replyContent.trim()) {
      onReplySubmit(replyContent);
      setReplyContent('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-black flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        Replies ({thread.replies?.length || 0})
      </h2>

      {/* Existing Replies */}
      <div className="space-y-4 mb-6">
        {thread.replies && thread.replies.length > 0 ? (
          thread.replies.map((reply) => (
            <div key={`reply-${reply.ID}`} className="bg-gray-50 rounded-lg p-4 text-black">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-black">{reply.User?.name || 'Anonymous'}</span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(reply.CreatedAt).toLocaleString()} {/* CreatedAt is a default param and therefore cap*/}
                </span>
              </div>
              <p className="text-black whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No replies yet. Be the first to reply!</div>
        )}
      </div>

      {/* Reply Form */}
      <div className="mt-4">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write a reply..."
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
        />
        <button 
          onClick={handleSubmit}
          disabled={!replyContent.trim()}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post Reply
        </button>
      </div>
    </div>
  );
};

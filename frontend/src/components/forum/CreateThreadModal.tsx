import React, { useState } from 'react';
import { X } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { api } from '../../services/api'

type CreateThreadModalProps = {
  section: string;
  onClose: () => void;
  onThreadCreated: (newThread: any) => void;
}

export const CreateThreadModal = ({ section, onClose, onThreadCreated }: CreateThreadModalProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (title.trim() && content.trim()) {
      try {
        // Call the API to create a thread
        const newThread = await api.createThread({
          title: title.trim(),
          content: content.trim(),
          section: section,
        });
        setTitle('');
        setContent('');
        onThreadCreated(newThread);
        onClose();
      } catch (error) {
        console.error('Error creating thread:', error);
        setError('Failed to create thread. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError('Title and content are required.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl text-black font-bold">Create New Thread</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded bg-gray-200 text-black focus:ring-2 focus:ring-blue-500"
                placeholder="Enter thread title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  preview="edit"
                  height={300}
                />
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Supports Markdown formatting. You can use **bold**, *italic*, [links](url), and more.
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

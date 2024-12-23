import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThreadView } from '../forum/ThreadView';
import { api } from '../../services/api';
import type { Thread } from '../../types';

export const ThreadViewWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThread = async () => {
      try {
        setLoading(true);
        const threadData = await api.getThread(Number(id));
        setThread(threadData);
      } catch (err) {
        console.error('Error loading thread:', err);
        setError('Failed to load thread');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadThread();
    }
  }, [id]);

  const handleReplySubmit = async (content: string) => {
    if (!thread) return;
    try {
      await api.createReply(thread.ID, content);
      // Reload thread to show new reply
      const updatedThread = await api.getThread(thread.ID);
      setThread(updatedThread);
    } catch (err) {
      console.error('Error creating reply:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error || !thread) {
    return <div className="text-center text-red-600 p-4">{error || 'Thread not found'}</div>;
  }

  return (
    <ThreadView
      thread={thread}
      onBack={() => navigate(-1)}
      onReplySubmit={handleReplySubmit}
    />
  );
};
import type { Thread } from '../../types'
import { ThreadCard } from './ThreadCard'
import { Link } from 'react-router-dom'

type ThreadListProps = {
  threads: Thread[];
  isLoading?: boolean;
  onThreadClick: (threadId: number) => void;
  setIsCreateModalOpen: (isOpen: boolean) => void;
  authToken: string | null;
}

export const ThreadList = ({ threads, isLoading, onThreadClick, setIsCreateModalOpen, authToken }: ThreadListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={`loading-${i}`} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No threads in this section yet.</p>
        <button 
          className="mt-4 text-blue-500 hover:text-blue-600"
          onClick={() => {
            setIsCreateModalOpen(true);
            console.log('Auth Token:', authToken);
          }}
        >
          Create the first thread
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Link to={`/thread/${thread.ID}`} key={`thread-${thread.ID}`}>
          <ThreadCard 
            thread={thread}
            onThreadClick={onThreadClick}
          />
        </Link>
      ))}
    </div>
  );
};

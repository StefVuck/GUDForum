import { ArrowLeft, Clock } from 'lucide-react'
import type { Thread } from '../../types'
import { ReplySection } from './ReplySection'
import { MarkdownContent } from '../common/MarkdownContent'
import { useNavigate } from 'react-router-dom'

type ThreadViewProps = {
  thread: Thread | null;
  onBack: () => void;
  onReplySubmit: (content: string) => void;
}

export const ThreadView = ({ thread, onBack, onReplySubmit }: ThreadViewProps) => {
  const navigate = useNavigate()

  if (!thread) {
    return <div>No thread selected.</div>;
  }

  console.log('Thread data:', thread);

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-white hover:text-red-600"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to threads
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl text-black font-bold mb-2">{thread.title}</h1>
        
        <div className="flex items-center text-sm text-gray-700 mb-6">
          <span className="flex items-center mr-4">
            <Clock className="w-4 h-4 mr-1" />
            {thread.CreatedAt ? new Date(thread.CreatedAt).toLocaleString() : 'Date not available'}
          </span>
          <span>by {thread.User && thread.User.name ? thread.User.name : 'Unknown Author'}</span>
        </div>

        <MarkdownContent 
          content={thread.content}
          className="mt-4 text-black"
        />
      </div>

      <ReplySection 
        thread={thread}
        onReplySubmit={onReplySubmit}
      />
    </div>
  )
}

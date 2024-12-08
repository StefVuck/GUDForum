import { ArrowLeft, Clock } from 'lucide-react'
import type { Thread } from '../../types'
import { ReplySection } from './ReplySection'

type ThreadViewProps = {
  thread: Thread;
  onBack: () => void;
  onReplySubmit: (content: string) => void;
}

export const ThreadView = ({ thread, onBack, onReplySubmit }: ThreadViewProps) => {
  console.log('thread', thread)
  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to threads
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{thread.title}</h1>
        
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span className="flex items-center mr-4">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(thread.createdAt).toLocaleDateString()}
          </span>
          <span>by {thread.author}</span>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-800 whitespace-pre-wrap">{thread.content}</p>
        </div>
      </div>

      <ReplySection 
        thread={thread}
        onReplySubmit={onReplySubmit}
      />
    </div>
  )
}

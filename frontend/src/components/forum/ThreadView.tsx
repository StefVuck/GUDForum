import { ArrowLeft, Clock } from 'lucide-react'
import type { Thread } from '../../types'
import { ReplySection } from './ReplySection'
import { MarkdownContent } from '../common/MarkdownContent'

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
        className="flex items-center text-black hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to threads
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{thread.title}</h1>
        
        <div className="flex items-center text-sm text-gray-700 mb-6">
          <span className="flex items-center mr-4">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(thread.createdAt).toLocaleDateString()}
          </span>
          <span>by {thread.author}</span>
        </div>

        <MarkdownContent 
          content={thread.content}
          className="mt-4"
        />
      </div>

      <ReplySection 
        thread={thread}
        onReplySubmit={onReplySubmit}
      />
    </div>
  )
}

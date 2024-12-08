import type { Thread } from '../../types'
import { MessageCircle, Clock } from 'lucide-react'

type ThreadCardProps = {
  thread: Thread;
  onThreadClick: (threadId: number) => void;
}

export const ThreadCard = ({ thread, onThreadClick }: ThreadCardProps) => {
  return (
    <div 
      onClick={() => onThreadClick(thread.ID)} // Make sure we're using uppercase ID from gorm.Model
      className="bg-white rounded-lg shadow p-4 mb-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="text-lg font-semibold mb-2">{thread.title}</h3>
      <p className="text-gray-600 mb-4 line-clamp-2">{thread.content}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {thread.replies?.length || 0} replies
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(thread.created_at).toLocaleDateString()}
          </span>
        </div>
        <span>by {thread.user?.name || 'Unknown'}</span>
      </div>
    </div>
  )
}

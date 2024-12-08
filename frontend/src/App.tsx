import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ThreadList } from './components/forum/ThreadList';
import { ThreadView } from './components/forum/ThreadView';
import { CreateThreadModal } from './components/forum/CreateThreadModal';
import { api } from './services/api';
import type { Thread } from './types';

function App() {
  const [currentSection, setCurrentSection] = useState('general');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch threads when section changes
  useEffect(() => {
    fetchThreads(currentSection);
  }, [currentSection]);

  const fetchThreads = async (section: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getThreads(section);
      setThreads(data);
    } catch (err) {
      setError('Failed to load threads');
      console.error('Error fetching threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadClick = async (threadId: number) => {
    try {
      if (!threadId) {
        console.error('No thread ID provided');
        return;
      }
      console.log('Fetching thread:', threadId); // Debug log
      setIsLoading(true);
      const thread = await api.getThread(threadId);
      setSelectedThread(thread);
    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (threadId: number, content: string) => {
    try {
      console.log('Creating reply for thread:', threadId); // Debug log
      if (!threadId) {
        console.error('No thread ID provided');
        return;
      }
      await api.createReply(threadId, content);
      // Refresh the thread to get the new reply
      const updatedThread = await api.getThread(threadId);
      setSelectedThread(updatedThread);
    } catch (err) {
      console.error('Error creating reply:', err);
    }
  };


  const handleThreadCreated = (newThread: Thread) => {
    setThreads(prevThreads => [newThread, ...prevThreads]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
      <main className="flex-1 p-8 overflow-auto">
        {selectedThread ? (
          <ThreadView 
            thread={selectedThread}
            onBack={() => setSelectedThread(null)}
            onReplySubmit={(content) => handleReplySubmit(selectedThread.ID, content)}
          />
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl text-black font-bold">
                {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                New Thread
              </button>
            </div>
            <ThreadList 
              threads={threads}
              isLoading={isLoading}
              onThreadClick={handleThreadClick}
            />
          </>
        )}

        {isCreateModalOpen && (
          <CreateThreadModal
            section={currentSection}
            onClose={() => setIsCreateModalOpen(false)}
            onThreadCreated={handleThreadCreated}
          />
        )}
      </main>
    </div>
  );
}

export default App;

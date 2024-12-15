import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { ForumHeader } from './components/layout/ForumHeader'
import { ThreadList } from './components/forum/ThreadList';
import { ThreadView } from './components/forum/ThreadView';
import { CreateThreadModal } from './components/forum/CreateThreadModal';
import { AuthProvider } from './context/AuthContext';
import { api } from './services/api';
import type { Thread } from './types';

function App() {
  const [currentSection, setCurrentSection] = useState('general');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Thread[]>(null);

  const sections = [
    { id: 'general' },
    { id: 'team' },
    { id: 'design' },
    { id: 'electronics' },
    { id: 'software' },
  ];

  useEffect(() => {
    // Retrieve the token from local storage
    const token = localStorage.getItem('token');
    setAuthToken(token);
  }, []);

  // Fetch threads when section changes
  useEffect(() => {
    fetchThreads(currentSection);
    setSelectedThread(null);
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

  const handleSearch = async (criteria: { type: string; query: string; section: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      // You'll need to implement this API endpoint
      const results = await api.searchThreads(criteria);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search threads');
      console.error('Error searching threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadCreated = (newThread: Thread) => {
    setThreads(prevThreads => [newThread, ...prevThreads]);
    setIsCreateModalOpen(false);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen w-screen bg-gray-100">
          <Sidebar 
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
          />
          <div className="flex-1 flex flex-col h-full">
            <ForumHeader
              totalThreads={threads.length}
              currentSection={currentSection}
              onSearch={handleSearch}
            /> 
            <main className="flex-1 h-full p-8 overflow-auto">
              <Routes>
                <Route path="/" element={<ThreadList 
                  threads={threads}
                  isLoading={isLoading}
                  onThreadClick={handleThreadClick}
                  setIsCreateModalOpen={setIsCreateModalOpen}
                  authToken={authToken}
                />} />
                {sections.map(section => (
                  <Route key={section.id} path={`/${section.id}`} element={<ThreadList 
                    threads={threads}
                    isLoading={isLoading}
                    onThreadClick={handleThreadClick}
                    setIsCreateModalOpen={setIsCreateModalOpen}
                    authToken={authToken}
                  />} />
                ))}
                <Route path="/thread/:id" element={<ThreadView 
                  thread={selectedThread}
                  onBack={() => setSelectedThread(null)}
                  onReplySubmit={(content) => handleReplySubmit(selectedThread.ID, content)}
                />} />
              </Routes>

              {isCreateModalOpen && (
                <CreateThreadModal
                  section={currentSection}
                  onClose={() => setIsCreateModalOpen(false)}
                  onThreadCreated={handleThreadCreated}
                />
              )}
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

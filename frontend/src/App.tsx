import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { ForumHeader } from './components/layout/ForumHeader'
import { ThreadList } from './components/forum/ThreadList';
import { ThreadViewWrapper } from './components/common/ThreadViewWrapper';
import { CreateThreadModal } from './components/forum/CreateThreadModal';
import { AuthProvider } from './context/AuthContext';
import { api } from './services/api';
import type { Thread } from './types';
import { ProfilePage } from './components/forum/ProfilePage';
import { PublicProfilePage } from './components/forum/PublicProfilePage';
import { RequireAuth } from './components/auth/RequireAuth';
import { AdminRolesPage } from './components/forum/AdminRolesPage';
import { NotFound } from './components/layout/NotFound';


function App() {
  const [currentSection, setCurrentSection] = useState('general');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Thread[] | null>(null);

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

    // Validate the token
    const validateToken = async (token: string | null) => {
      if (token) {
        try {
          const isValid = await api.validateToken(token); // Assume this API call checks token validity
          if (!isValid) {
            localStorage.removeItem('token');
            setAuthToken(null);
            setError('Session expired. Please log in again.');
          }
        } catch (err) {
          console.error('Error validating token:', err);
        }
      }
    };

    validateToken(token);
  }, []);

  // Fetch threads when section changes
  useEffect(() => {
    if (!searchResults) {
      fetchThreads(currentSection);
      setSelectedThread(null);
    }
  }, [currentSection]);

  const fetchThreads = async (section: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getThreads(section);
      setThreads(data);
      setSearchResults(null);
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
      const response = await api.searchThreads(criteria);
      console.log(response);
      setSearchResults(response.results);
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

  // Clear search results when changing sections
  const handleSectionChange = (section: string) => {
    setSearchResults(null);
    setCurrentSection(section);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen w-screen bg-gray-100">
          <RequireAuth>
          <Sidebar 
            currentSection={currentSection}
            onSectionChange={handleSectionChange}
          />
          <div className="flex-1 flex flex-col h-full">
          <ForumHeader
              totalThreads={(searchResults || threads).length}
              currentSection={currentSection}
              onSearch={handleSearch}
              isSearchActive={!!searchResults}
              onClearSearch={() => {
                setSearchResults(null);
                fetchThreads(currentSection);
              }}
              setIsCreateModalOpen={setIsCreateModalOpen} 
            />
            <main className="flex-1 h-full p-8 overflow-auto">
            <Routes>
              <Route path="/" element={
                <ThreadList 
                  threads={searchResults || threads}
                  isLoading={isLoading}
                  onThreadClick={handleThreadClick}
                  setIsCreateModalOpen={setIsCreateModalOpen}
                  authToken={authToken}
                />
              } />
              {sections.map(section => (
                <Route 
                  key={section.id} 
                  path={`/${section.id}`} 
                  element={
                    <ThreadList 
                      threads={searchResults || threads}
                      isLoading={isLoading}
                      onThreadClick={handleThreadClick}
                      setIsCreateModalOpen={setIsCreateModalOpen}
                      authToken={authToken}
                    />
                  }
                />
              ))}
              <Route 
                path="/thread/:id" 
                element={
                  <RequireAuth>
                    <ThreadViewWrapper />
                  </RequireAuth>
                } 
              />

              <Route 
                path="/profile" 
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                } 
              />

              <Route 
                path="/users/:userId" 
                element={
                  <RequireAuth>
                    <PublicProfilePage />
                  </RequireAuth>
                } 
              />
              <Route 
                path="/admin/roles" 
                element={
                  <RequireAuth roles={['admin']}>
                    <AdminRolesPage />
                  </RequireAuth>
                } 
              />

              <Route path="*" element={<NotFound />} />
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
          </RequireAuth>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

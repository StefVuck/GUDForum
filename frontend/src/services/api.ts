const API_URL = 'http://localhost:8080/api';

// Helper function for common fetch options
const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  // Get all threads for a section
  getThreads: (section: string) => 
    fetchApi(`/sections/${section}/threads`),

  // Get single thread with replies
  getThread: (threadId: number) => 
    fetchApi(`/threads/${threadId}`),

  // Create new thread
  createThread: (threadData: Partial<Thread>) => 
    fetchApi('/threads', {
      method: 'POST',
      body: JSON.stringify(threadData),
    }),

  // Get replies for a thread
  getReplies: (threadId: number) => 
    fetchApi(`/threads/${threadId}/replies`),

  // Create new reply
  createReply: (threadId: number, content: string) => 
    fetchApi(`/threads/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

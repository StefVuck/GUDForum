const API_URL = 'http://localhost:8080/api';

// Helper function for common fetch options
const fetchApi = async (endpoint: string, options?: RequestInit) => {
  // Retrieve the token from local storage or wherever you store it
  const token = localStorage.getItem('token'); // Adjust this based on your storage method

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // Include token if it exists
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

  // Login user
  login: async (email: string, password: string) => {
    const response = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store the token in local storage
    localStorage.setItem('token', response.token); // Adjust based on your response structure

    return response;
  },

  // Register user
  register: async (email: string, password: string, name: string) => {
    try {
      const response = fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      // Store the token in local storage
      localStorage.setItem('token', response.token); // Adjust based on your response structure
      console.log("Registration Success")
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Rethrow the error if you want to handle it further up
    }
  },
};


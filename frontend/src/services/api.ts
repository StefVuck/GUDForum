const API_URL = 'http://localhost:8080/api';

type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    verified: boolean;
  };
};

type RegisterResponse = {
  message: string;
  verify_token?: string; // Only in development
};

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

    login: async (email: string, password: string): Promise<LoginResponse> => {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
  
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
  
      return response;
    },
  
    register: async (email: string, password: string, name: string) => {
      try {
        console.log('Sending registration request:', { email, name });
        
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        });
  
        const data = await response.json();
        console.log('Raw backend response:', data);
  
        if (!response.ok) {
          throw new Error(data.error || `API Error: ${response.statusText}`);
        }
  
        // Check if we actually got a verification token
        if (!data.verify_token) {
          console.warn('No verification token in response:', data);
        }
  
        return data;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },


    verifyEmail: async (token: string) => {
      if (!token) {
        throw new Error('Verification token is required');
      }
      return fetchApi(`/auth/verify?token=${token}`);
    }
};


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

type ProfileUpdateData = {
  bio?: string;
  profile_picture_url?: string;
};


type PublicUserProfile = {
  ID: number;
  name: string;
  role: {
    name: string;
    color: string;
  };
  join_date: string;
  recent_activity: {
    threads: Array<{
      ID: number;
      title: string;
      created_at: string;
      section: string;
    }>;
    replies: Array<{
      ID: number;
      thread_title: string;
      content: string;
      created_at: string;
      thread_id: number;
    }>;
  };
  stats: {
    total_threads: number;
    total_replies: number;
    top_sections: Array<{
      section: string;
      count: number;
    }>;
  };
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

  const responseBody = await response.json();
  console.log('Response Body:', responseBody); // Log the response body

  if (!response.ok) {
    throw new Error(`API Error: ${responseBody.error}`);
  }

  return responseBody;
};

export const api = {
  // User Profile Methods
  getUserProfile: (userId: number) => 
    fetchApi(`/users/${userId}`),

  getUserStats: (userId: number) => 
    fetchApi(`/users/${userId}/stats`),

  // Role Management Methods
  getRoles: () => 
    fetchApi('/roles'),

  getUsers: () => 
    fetchApi('/users'),

  getCurrentUserProfile: () => 
    fetchApi('/profile'),

  getCurrentUserStats: () => 
    fetchApi('/profile/stats'),

  getPublicUserProfile: (userId: string | number): Promise<PublicUserProfile> => 
    fetchApi(`/users/${userId}/public-profile`),

  // Get public activity for any user
  getUserActivity: (userId: string | number) => 
    fetchApi(`/users/${userId}/activity`),

  updateUserRole: async (userId: number, roleId: number) => {
    const response = await fetchApi(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleId }),
    });
    return response; // Return the parsed response (includes updated user)
  },

  updateProfile: (data: ProfileUpdateData) => 
    fetchApi('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

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
    console.log(response);
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

    searchThreads: async ({ type, query, section }: { 
      type: string; 
      query: string; 
      section: string;
    }) => {
      const params = new URLSearchParams({
        type,
        query,
        section
      });
      
      return fetchApi(`/search?${params.toString()}`);
    },


    verifyEmail: async (token: string) => {
      if (!token) {
        throw new Error('Verification token is required');
      }
      return fetchApi(`/auth/verify?token=${token}`);
    },


    validateToken: async (token: string): Promise<boolean> => {
      try {
        const response = await fetch(`${API_URL}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return false; 
        }

        return true; 
      } catch (error) {
        console.error('Error validating token:', error);
        return false;
      }
    },
};


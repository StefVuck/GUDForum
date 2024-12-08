// src/types/index.ts
export type Thread = {
  ID: number;           // GORM uses uppercase ID
  created_at: string;   // GORM uses snake_case
  updated_at: string;
  title: string;
  content: string;
  section: string;
  user_id: number;
  user?: User;
  replies?: Reply[];
}

export type User = {
  ID: number;
  name: string;
  email: string;
  role: string;
}

export type Reply = {
  ID: number;
  content: string;
  thread_id: number;
  user_id: number;
  created_at: string;
  user?: User;
}


export type Section = {
  id: string;
  name: string;
  description: string;
  threadCount?: number;
}

// src/services/api.ts
const API_BASE_URL = 'http://localhost:8080/api';

export const api = {
  async getThreads(section: string) {
    const response = await fetch(`${API_BASE_URL}/threads/${section}`);
    if (!response.ok) throw new Error('Failed to fetch threads');
    return response.json();
  },

  async createThread(data: Partial<Thread>) {
    const response = await fetch(`${API_BASE_URL}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create thread');
    return response.json();
  }
};

// src/components/layout/Sidebar.tsx
import React from 'react';
import { MessageCircle, Users, Drone, Tool, Book } from 'lucide-react';

export const Sidebar = ({ currentSection, onSectionChange }) => {
  const sections = [
    { id: 'general', name: 'General Discussion', icon: MessageCircle },
    { id: 'team', name: 'Team Management', icon: Users },
    { id: 'design', name: 'Design Team', icon: Drone },
    { id: 'electronics', name: 'Electronics', icon: Tool },
    { id: 'software', name: 'Software Development', icon: Book }
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">GU Drones Forum</h1>
        <nav>
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center p-2 mb-2 rounded ${
                  currentSection === section.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {section.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// src/components/forum/ThreadCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const ThreadCard = ({ thread }) => {
  return (
    <Card className="hover:bg-gray-50 cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg">{thread.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Posted by {thread.user?.name}</span>
          <span>{thread.replies_count || 0} replies</span>
        </div>
      </CardContent>
    </Card>
  );
};

// src/components/forum/CreateThreadModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export const CreateThreadModal = ({ section, onThreadCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newThread = await api.createThread({
        title,
        content,
        section,
      });
      onThreadCreated(newThread);
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        New Thread
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread Title"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Thread Content"
              className="w-full p-2 border rounded h-32"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Thread
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// src/App.tsx
import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ThreadCard } from './components/forum/ThreadCard';
import { CreateThreadModal } from './components/forum/CreateThreadModal';
import { api } from './services/api';

export default function App() {
  const [currentSection, setCurrentSection] = useState('general');
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    fetchThreads();
  }, [currentSection]);

  const fetchThreads = async () => {
    try {
      const data = await api.getThreads(currentSection);
      setThreads(data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const handleThreadCreated = (newThread) => {
    setThreads(prev => [newThread, ...prev]);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
      <div className="flex-1 p-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
          </h2>
          <CreateThreadModal
            section={currentSection}
            onThreadCreated={handleThreadCreated}
          />
        </div>
        <div className="space-y-4">
          {threads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      </div>
    </div>
  );
}

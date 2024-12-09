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
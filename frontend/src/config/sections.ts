// src/config/sections.ts
import { MessageCircle, Users, PlaneTakeoff, Wrench, Code } from 'lucide-react';

export const SECTIONS = [
  {
    id: 'general',
    name: 'General Discussion',
    description: 'General drone society discussions and announcements',
    icon: MessageCircle
  },
  {
    id: 'team',
    name: 'Team Management',
    description: 'Team organization and planning',
    icon: Users
  },
  {
    id: 'design',
    name: 'Design Team',
    description: 'Drone design and CAD discussions',
    icon: PlaneTakeoff
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Electronics and control systems',
    icon: Wrench
  },
  {
    id: 'software',
    name: 'Software Development',
    description: 'Flight software and automation',
    icon: Code
  }
];

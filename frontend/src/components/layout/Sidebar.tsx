import React, { useState } from 'react';
import { MessageCircle, Users, PlaneTakeoff, Wrench, Code } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';

type SidebarProps = {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ currentSection, onSectionChange }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const sections = [
    { id: 'general', name: 'General Discussion', icon: MessageCircle },
    { id: 'team', name: 'Team Management', icon: Users },
    { id: 'design', name: 'Design Team', icon: PlaneTakeoff },
    { id: 'electronics', name: 'Electronics', icon: Wrench },
    { id: 'software', name: 'Software Development', icon: Code }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full">

      <div className="p-4">
      <h1 className="text-xl text-black font-bold mb-4">GU Drones Forum</h1>
        {/* Auth Section */}
        <div className="mb-6">
          {user ? (
            <div className="p-3 bg-gray-50 text-black rounded">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <button
                onClick={logout}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Login / Register
            </button>
          )}
        </div>

        {/* Sections */}
        <nav>
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center p-2 mb-2 rounded ${
                  currentSection === section.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {section.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

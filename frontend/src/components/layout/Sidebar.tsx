import React, { useState } from 'react';
import { MessageCircle, Users, PlaneTakeoff, Wrench, Code, UserCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { useNavigate } from 'react-router-dom';

type SidebarProps = {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ currentSection, onSectionChange }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const sections = [
    { id: 'general', name: 'General Discussion', icon: MessageCircle },
    { id: 'team', name: 'Team Management', icon: Users },
    { id: 'design', name: 'Design Team', icon: PlaneTakeoff },
    { id: 'electronics', name: 'Electronics', icon: Wrench },
    { id: 'software', name: 'Software Development', icon: Code }
  ];

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    navigate(`/${section}`);
  };

  const navigateToProfile = () => {
    if (user) {
      navigate(`/profile`);
      setShowUserMenu(false);
    }
  };

  const navigateToRoleManagement = () => {
    navigate('/admin/roles');
    setShowUserMenu(false);
  };

  return (
<div className="w-70 bg-white shadow-lg h-full flex flex-col">
  <div className="p-4">
    <h1 className="text-xl text-black font-bold mb-4">GU Drones Forum</h1>
    {/* Auth Section */}
    <div className="mb-6">
      {user ? (
        <div>
          <button
            className="w-full p-3 bg-gray-200 text-black rounded flex items-center justify-between hover:bg-gray-300"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <span className={`ml-2 transition-transform ${!showUserMenu ? "rotate-180" : ""}`}>▼</span>
          </button>
          {showUserMenu && (
            <div className="mt-2 ml-2 mr-2 border-l bg-white border-gray-200">
              <button
                onClick={navigateToProfile}
                className="w-full text-left mb-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-200 flex items-center gap-2 rounded-md"
              >
                <UserCircle className="w-5 h-5 text-gray-500" />
                View Profile
              </button>

              {user.role.name === 'admin' && (
                <button
                  onClick={navigateToRoleManagement}
                  className="w-full text-left mb-1 px-4 py-2 text-gray-700 bg-red-200 hover:bg-red-700 flex items-center gap-2 rounded-md"
                >
                  <Shield className="w-5 h-5 text-gray-500" />
                  Role Management
                </button>
              )}

              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-red-600 bg-gray-200 hover:bg-red-100 flex items-center gap-2 rounded-md"
              >
                Logout
              </button>
            </div>
          )}
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
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => handleSectionChange(section.id)}
            className={`w-full flex items-center p-2 mb-2 rounded ${
              currentSection === section.id ? "bg-blue-100 text-blue-600" : "hover:bg-gray-700"
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
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
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-4">
        <h1 className="text-xl text-black font-bold mb-4">GU Drones Forum</h1>
        {/* Auth Section */}
        <div className="mb-6">
          {user ? (
            <div className="relative">
              <div 
                className="p-3 bg-gray-100 text-black rounded cursor-pointer hover:bg-gray-300 hover:ring"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <p className="font-medium flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  {user.name}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                  <button
                    onClick={navigateToProfile}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserCircle className="w-4 h-4" />
                    View Profile
                  </button>
                  
                  {user.role === 'admin' && (
                    <button
                      onClick={navigateToRoleManagement}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Role Management
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 border-t"
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
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
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
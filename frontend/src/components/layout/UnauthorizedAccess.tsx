import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '../auth/AuthModal';
import { Lock } from 'lucide-react';

export const UnauthorizedAccess = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 w-full">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Welcome to GU Drones Forum
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          Please log in with your Glasgow University student account to access the forum.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Log In / Register
          </button>
          
          <button
            onClick={() => window.open('https://www.glasgowunisrc.org/organisation/14447/', '_blank')}
            className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Get SRC Membership
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>Need help? Visit our GitHub page:</p>
          <a href="https://github.com/stefvuck/gudforum" target="_blank" rel="noopener noreferrer" className="font-medium">github.com/stefvuck/gudforum</a>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

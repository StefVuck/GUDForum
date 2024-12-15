import React, { useState } from 'react';
import { X, Check, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthModalProps = {
  onClose: () => void;
};

type ModalState = 'login' | 'register' | 'verify' | 'verification-needed';

export const AuthModal = ({ onClose }: AuthModalProps) => {
  const [modalState, setModalState] = useState<ModalState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>(''); 

  const { login, register, verifyEmail, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    try {
      if (modalState === 'login') {
        await login(email, password);
        onClose();
      } else if (modalState === 'register') {
        const response = await register(email, password, name);
        console.log('Registration response:', response);
        
        if (response && response.verify_token) {
          setVerificationToken(response.verify_token);
          setMessage(response.message || 'Registration successful! Please verify your email.');
          setModalState('verify');
        } else {
          setMessage('Registration successful but verification token was not received.');
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage('An unexpected error occurred');
      }
    }
  };

  const handleVerification = async () => {
    try {
      await verifyEmail(verificationToken);
      setMessage('Email verified successfully! You can now log in.');
      setModalState('login');
    } catch (err) {
      if (err instanceof Error) {
        setMessage(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {modalState === 'verify' ? 'Verify Email' : 
             modalState === 'login' ? 'Login' : 'Register'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
  
        {debugInfo && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
            <strong>Debug Info:</strong>
            <pre>{debugInfo}</pre>
          </div>
        )}
  
        {message && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            {message}
          </div>
        )}
  
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
  
        {modalState === 'verify' ? (
          <div className="space-y-4">
            {verificationToken ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Development Mode Verification</h3>
                <p className="text-sm text-gray-600 mb-2">Verification Token:</p>
                <code className="block p-2 bg-gray-100 rounded text-sm overflow-auto break-all">
                  {verificationToken}
                </code>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-700">No verification token available. Please try registering again.</p>
              </div>
            )}
            
            <button
              onClick={handleVerification}
              disabled={isLoading || !verificationToken}
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? (
                'Verifying...'
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Verify Email
                </>
              )}
            </button>
            
            <button
              onClick={() => setModalState('login')}
              className="w-full text-blue-500 hover:text-blue-700"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email (@student.gla.ac.uk)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
                pattern=".*@student\.gla\.ac\.uk$"
                title="Please use your Glasgow University email address"
              />
            </div>
  
            {modalState === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
  
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>
  
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? (
                'Loading...'
              ) : modalState === 'login' ? (
                <>
                  <Mail className="w-5 h-5" />
                  Login
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Register
                </>
              )}
            </button>
  
            {modalState !== 'verify' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setModalState(modalState === 'login' ? 'register' : 'login')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {modalState === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
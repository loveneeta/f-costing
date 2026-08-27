import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SuspendedView: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 text-orange-600 p-4 rounded-full">
            <ShieldAlert size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Account Suspended</h1>
        <p className="text-neutral-500 mb-6">
          Your organization's account is currently suspended or past due. Please contact your company administrator or our support team to restore access.
        </p>
        <button 
          onClick={handleLogout}
          className="bg-neutral-800 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-neutral-900 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

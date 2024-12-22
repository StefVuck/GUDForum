import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type UserProfile = {
  ID: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
    color: string;
  };
  total_threads: number;
  total_replies: number;
  join_date: string;
  last_active: string;
};

type UserStats = {
  threadsBySection: Record<string, number>;
  repliesByMonth: Record<string, number>;
  avgResponseTime: number;
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        
        const [profileData, statsData] = await Promise.all([
          api.getCurrentUserProfile(),
          api.getCurrentUserStats()
        ]);
        
        setProfile(profileData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center p-4">Failed to load profile</div>;
  }

  return (
    <div className="max-w-4xl text-black  mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-600">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {profile.name}
              <span 
                className="px-2 py-1 text-sm rounded text-white"
                style={{ backgroundColor: profile.role.color }}
              >
                {profile.role.name}
              </span>
            </h1>
            <p className="text-gray-500">
              Member since {new Date(profile.join_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl text-black font-bold">{profile.total_threads}</div>
          <div className="text-gray-500">Threads Created</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl text-black font-bold">{profile.total_replies}</div>
          <div className="text-gray-500">Total Replies</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl text-black font-bold">
            {stats?.avgResponseTime ? `${Math.round(stats.avgResponseTime)}h` : 'N/A'}
          </div>
          <div className="text-gray-500">Avg Response Time</div>
        </div>
      </div>

      {/* Activity Charts */}
      {stats && (
        <div className="bg-white text-black rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Activity Overview</h2>
          
          {/* Section Distribution */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Threads by Section</h3>
            <div className="space-y-2">
              {Object.entries(stats.threadsBySection).map(([section, count]) => (
                <div key={section} className="flex items-center gap-2">
                  <div className="w-32 text-gray-600">{section}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(count / profile.total_threads) * 100}%`
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-gray-600">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Activity */}
          <div>
            <h3 className="font-semibold mb-2">Recent Activity</h3>
            <div className="space-y-2">
              {Object.entries(stats.repliesByMonth).map(([month, count]) => (
                <div key={month} className="flex items-center gap-2">
                  <div className="w-32 text-gray-600">{month}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.repliesByMonth))) * 100}%`
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-gray-600">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

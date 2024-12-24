import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Clock } from 'lucide-react';

type UserProfile = {
  id: number;
  email: string;
  name: string;
  role: {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: null | string;
    name: string;
    color: string;
  };
  join_date: string;
  stats: {
    activity_map: Record<string, number>;
    metrics: {
      activity_heatmap: Record<string, number>;
      avg_response_time: number;
      last_active: string;
    };
    recent_activity: {
      replies: Array<{
        ID: number;
        content: string;
        thread_id: number;
        thread_title: string;
        created_at: string;
      }>;
      threads: Array<{
        ID: number;
        title: string;
        section: string;
        created_at: string;
      }>;
    };
    top_sections: Array<{
      section: string;
      count: number;
    }>;
    total_replies: number;
    total_threads: number;
  };
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        const profileData = await api.getCurrentUserProfile();
        setProfile(profileData);
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
    <div className="max-w-4xl text-black mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6">
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
              {profile.email}
            </p>
            <p className="text-gray-500">
              Member since {new Date(profile.join_date).toLocaleDateString()}
            </p>
            <p className="text-gray-500">
                {/* -3600000 is the 1 jan 1970 unix default*/}
              Last active: {profile.stats.metrics.last_active && new Date(profile.stats.metrics.last_active).getTime() !== -3600000 ? new Date(profile.stats.metrics.last_active).toLocaleString() : "Never"}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl text-black font-bold">{profile.stats.total_threads}</div>
          <div className="text-gray-500">Threads Created</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl text-black font-bold">{profile.stats.total_replies}</div>
          <div className="text-gray-500">Total Replies</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl text-black font-bold">
            {Math.round(profile.stats.metrics.avg_response_time)}h
          </div>
          <div className="text-gray-500">Avg Response Time</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Threads */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Recent Threads
          </h2>
          <div className="space-y-4">
            {profile.stats.recent_activity.threads && profile.stats.recent_activity.threads.length > 0 ? (
              profile.stats.recent_activity.threads.map(thread => (
                <div key={thread.ID} className="border-b pb-2">
                  <Link 
                    to={`/thread/${thread.ID}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {thread.title}
                  </Link>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(thread.created_at).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    {thread.section}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No threads yet</div>
            )}
          </div>
        </div>

        {/* Recent Replies */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Replies</h2>
          <div className="space-y-4">
            {profile.stats.recent_activity.replies && profile.stats.recent_activity.replies.length > 0 ? (
              profile.stats.recent_activity.replies.map(reply => (
                <div key={reply.ID} className="border-b pb-2">
                  <div className="text-sm text-gray-500">
                    In thread: <Link 
                      to={`/thread/${reply.thread_id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {reply.thread_title}
                    </Link>
                  </div>
                  <p className="text-gray-700 mt-1 line-clamp-2">{reply.content}</p>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No replies yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Activity Overview</h2>
        
        {/* Section Distribution */}
        {profile.stats.top_sections && profile.stats.top_sections.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Threads by Section</h3>
            <div className="space-y-2">
              {profile.stats.top_sections?.map(({ section, count }) => (
                <div key={section} className="flex items-center gap-2">
                  <div className="w-32 text-gray-600 capitalize">{section}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(count / profile.stats.total_threads) * 100}%`
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-gray-600">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

       {/* Activity Heatmap */}
        <div className="mb-8">
        <h3 className="font-semibold mb-4">Activity Hours</h3>
        <div className="space-y-2">
            {profile.stats.metrics.activity_heatmap && Object.keys(profile.stats.metrics.activity_heatmap).length > 0 ? (
            Object.entries(profile.stats.metrics.activity_heatmap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([timeSlot, count]) => (
                <div key={timeSlot} className="flex items-center gap-2">
                    <div className="w-32 text-gray-600">{timeSlot}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                        width: `${(count / Math.max(...Object.values(profile.stats.metrics.activity_heatmap))) * 100}%`
                        }}
                    />
                    </div>
                    <div className="w-12 text-right text-gray-600">{count}</div>
                </div>
                ))
            ) : (
            <div className="text-gray-500">No activity recorded for heatmap</div>
            )}
        </div>
        </div>

        {/* Monthly Activity */}
        <div>
        <h3 className="font-semibold mb-4">Monthly Activity</h3>
        <div className="space-y-2">
            {profile.stats.activity_map && Object.keys(profile.stats.activity_map).length > 0 ? (
            Object.entries(profile.stats.activity_map)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, count]) => (
                <div key={month} className="flex items-center gap-2">
                    <div className="w-32 text-gray-600">{month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                        width: `${(count / Math.max(...Object.values(profile.stats.activity_map))) * 100}%`
                        }}
                    />
                    </div>
                    <div className="w-12 text-right text-gray-600">{count}</div>
                </div>
                ))
            ) : (
            <div className="text-gray-500">No monthly activity data available</div>
            )}
        </div>
        </div>
      </div>
    </div>
  );
};
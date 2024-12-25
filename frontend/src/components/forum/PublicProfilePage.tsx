import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { MessageSquare, Clock } from 'lucide-react';
import { ProfileHeader } from './ProfileHeader';
// Updated type to match actual API response
type PublicUserProfile = {
  id: number;
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
  profile_picture_url: string;
  bio: string;
  stats: {
    total_threads: number;
    total_replies: number;
    top_sections: Array<{
      section: string;
      count: number;
    }> | null;
    recent_activity: {
      threads: Array<{
        ID: number;
        title: string;
        created_at: string;
        section: string;
      }>;
      replies: Array<{
        ID: number;
        content: string;
        thread_id: number;
        thread_title: string;
        created_at: string;
      }>;
    };
    metrics: {
      avg_response_time: number;
      activity_heatmap: Record<string, number> | null;
      last_active: string;
    };
  };
};

export const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicUserProfile(userId!);
        setProfile(data);
      } catch (err) {
        setError('Failed to load user profile');
        console.error('Error fetching public profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error || !profile) {
    return <div className="text-center p-4 text-red-600">{error || 'Profile not found'}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <ProfileHeader 
        profile={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          bio: profile.bio,
          profile_picture_url: profile.profile_picture_url,
          join_date: profile.join_date,
          currentUserId: userId, // From your auth context
        }}
        canEdit={false}
        onUpdate={() => {}}
      />
      {/* Activity Overview */}
      <div className="grid text-black grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Activity Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-black">Statistics</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-2xl font-bold text-black">{profile.stats.total_threads}</div>
            <div className="text-gray-500">Total Threads</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-black">{profile.stats.total_replies}</div>
            <div className="text-gray-500">Total Replies</div>
          </div>
        </div>
        
        {profile.stats.top_sections && profile.stats.top_sections.length > 0 && (
          <>
            <h3 className="font-semibold mb-2 text-black">Most Active Sections</h3>
            <div className="space-y-2">
              {profile.stats.top_sections.map(({ section, count }) => (
                <div key={section} className="flex items-center gap-2">
                  <div className="w-32 text-gray-600">{section}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(count / Math.max(...profile.stats.top_sections.map(s => s.count))) * 100}%`
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-gray-600">{count}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Last Active */}
        {profile.stats.metrics.last_active && profile.stats.metrics.last_active !== '0001-01-01T00:00:00Z' && (
          <div className="mt-4 text-gray-600">
            Last active: {new Date(profile.stats.metrics.last_active).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};
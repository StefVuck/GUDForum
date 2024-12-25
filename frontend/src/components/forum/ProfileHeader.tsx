import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Edit2, X, Check } from 'lucide-react';
import { api } from '../../services/api';

type ProfileHeaderProps = {
  profile: {
    id: number;
    name: string;
    email: string;
    bio?: string;
    profile_picture_url?: string;
    join_date: string;
    role: {
      name: string;
      color: string;
    };
  };
  canEdit: boolean;  // Changed from isPublicView to canEdit
  onUpdate?: (updatedProfile: any) => void;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  canEdit = false,
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [profilePicture, setProfilePicture] = useState(profile.profile_picture_url || '');
  
  const handleSave = async () => {
    try {
      const updatedProfile = await api.updateProfile({
        bio,
        profile_picture_url: profilePicture
      });
      onUpdate?.(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfilePicture(url);
  };

  return (
    <div className="bg-white text-black rounded-lg shadow p-6">
      <div className="flex items-start gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {isEditing && canEdit && (
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Edit2 className="w-6 h-6 text-white" />
            </label>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
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
              {canEdit && (  // Only show email on editable (personal) profile
                <p className="text-gray-500">{profile.email}</p>
              )}
              <p className="text-gray-500">
                Member since {new Date(profile.join_date).toLocaleDateString()}
              </p>
            </div>
            {canEdit && (
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className="p-2 rounded border bg-gray-200"
              >
                {isEditing ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Edit2 className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}
          </div>

          <div className="mt-4">
            {isEditing && canEdit ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself..."
                className="w-full p-2 border rounded-md bg-gray-100"
                rows={3}
              />
            ) : (
              <p className="text-gray-700">
                {profile.bio || "No bio yet"}
              </p>
            )}
          </div>

          {isEditing && canEdit && (
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

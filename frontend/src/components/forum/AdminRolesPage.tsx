import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

type Role = {
  id: number;
  name: string;
  color: string;
  permissions: Record<string, boolean>;
};

type User = {
  ID: number;
  name: string;
  email: string;
  role: Role;
};

export const AdminRolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, usersData] = await Promise.all([
          api.getRoles(),
          api.getUsers()
        ]);
        setRoles(rolesData);
        setUsers(usersData);
      } catch (error) {
        setError('Failed to fetch data');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await api.updateUserRole(userId, roleId);
      // Update local state after successful API call
      setUsers(users.map(user => 
        user.ID === userId 
          ? { ...user, role: roles.find(r => r.id === roleId)! }
          : user
      ));
    } catch (error) {
      setError('Failed to update user role');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Role Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {roles.map(role => (
          <div key={role.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <span 
                className="px-2 py-1 rounded text-white text-sm"
                style={{ backgroundColor: role.color }}
              >
                {role.name}
              </span>
              <span className="text-sm text-gray-500">
                {users.filter(u => u.role.id === role.id).length} users
              </span>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">Permissions:</h4>
              <ul className="space-y-1">
                {Object.entries(role.permissions).map(([perm, allowed]) => (
                  <li key={perm} className="flex items-center gap-2 text-sm">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        allowed ? 'bg-green-500' : 'bg-red-500'
                      }`} 
                    />
                    {perm.split('_').join(' ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.ID}>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className="px-2 py-1 rounded text-white text-sm"
                    style={{ backgroundColor: user.role.color }}
                  >
                    {user.role.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    className="border rounded px-2 py-1"
                    value={user.role.id}
                    onChange={(e) => handleRoleChange(user.ID, Number(e.target.value))}
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

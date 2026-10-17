import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/accounts/user/');
      const djangoUser = response.data;
      const userProfile: UserProfile = {
        uid: djangoUser.id.toString(),
        email: djangoUser.email,
        role: djangoUser.role,
        name: `${djangoUser.first_name} ${djangoUser.last_name}`.trim() || djangoUser.username,
        university: 'UniPortal',
        photoUrl: '',
        faculty: djangoUser.faculty,
        department: djangoUser.department,
      };
      setUser(userProfile);
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
      setError(err?.response?.data?.message || 'Failed to authenticate user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  return {
    user,
    setUser,
    loading,
    error,
    refetchUser: fetchCurrentUser,
    logout,
    isAuthenticated: !!user,
  };
}

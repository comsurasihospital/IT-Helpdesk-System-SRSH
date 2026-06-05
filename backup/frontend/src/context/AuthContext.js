// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [lineProfile, setLineProfile] = useState(null);
  const [liffReady,   setLiffReady]   = useState(false);
  const [loading,     setLoading]     = useState(true);

  // Init LIFF (เฉพาะเมื่อมี LIFF_ID จริง)
  useEffect(() => {
    const liffId = process.env.REACT_APP_LIFF_ID;
    if (!liffId || liffId === 'your_liff_id_here') {
      // Dev mode — ข้าม LIFF
      setLiffReady(true);
      setLoading(false);
      return;
    }
    initLiff(liffId);
  }, []); // eslint-disable-line

  const initLiff = async (liffId) => {
    try {
      const liff = (await import('@line/liff')).default;
      await liff.init({ liffId });
      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        setLineProfile(profile);
        if (!token) {
          await handleLineLogin(profile);
        } else {
          // มี token อยู่แล้ว — sync role/user จาก DB ทุกครั้ง
          try {
            const meRes = await authAPI.getMe();
            saveSession(token, meRes.data.data);
          } catch {
            // token หมดอายุ — login ใหม่
            await handleLineLogin(profile);
          }
        }
      } else {
        liff.login();
      }
    } catch (err) {
      console.error('LIFF init error:', err);
    } finally {
      setLiffReady(true);
      setLoading(false);
    }
  };

  const handleLineLogin = async (profile) => {
    try {
      const res = await authAPI.lineLogin({
        lineUserId:      profile.userId       || null,
        lineDisplayName: profile.displayName  || null,
        linePictureUrl:  profile.pictureUrl   || null,
      });
      const data = res.data.data;
      if (data.isNewUser) return { isNewUser: true, lineProfile: profile };
      saveSession(data.token, data.user);
      return { isNewUser: false };
    } catch (err) {
      console.error('Line login error:', err);
      return { isNewUser: false, error: true };
    }
  };

  const register = async (formData) => {
    const res = await authAPI.register({
      lineUserId:      formData.lineUserId      || null,
      lineDisplayName: formData.lineDisplayName || null,
      linePictureUrl:  formData.linePictureUrl  || null,
      prefixId:        formData.prefixId        || null,
      firstName:       formData.firstName       || null,
      lastName:        formData.lastName        || null,
      phone:           formData.phone           || null,
      departmentId:    formData.departmentId    || null,
    });
    const data = res.data.data;
    saveSession(data.token, data.user);
    return data;
  };

  // Dev Mock Login — เรียก API จริงเพื่อดึง user ตาม role จาก DB
  const mockLogin = async (role = 'USER') => {
    try {
      const res = await authAPI.getMockUser(role);
      const data = res.data.data;
      const mockToken = 'mock.' + btoa(JSON.stringify({ userId: data.id, role: data.role })) + '.mock';
      // save token ก่อน แล้วดึง /me เพื่อให้ได้ข้อมูลครบ รวม prefix_id
      localStorage.setItem('token', mockToken);
      try {
        const meRes = await authAPI.getMe();
        saveSession(mockToken, meRes.data.data);
      } catch {
        saveSession(mockToken, data);
      }
    } catch (err) {
      console.error('mockLogin error:', err);
      const fallback = {
        USER:       { id: 1, firstName: 'Test', lastName: 'User',  role: 'USER',       departmentId: 1 },
        ADMIN:      { id: 2, firstName: 'Test', lastName: 'Admin', role: 'ADMIN',      departmentId: 1 },
        SUPERVISOR: { id: 3, firstName: 'Test', lastName: 'Sup',   role: 'SUPERVISOR', departmentId: 1 },
      };
      const u = fallback[role];
      const mockToken = 'mock.' + btoa(JSON.stringify({ userId: u.id, role })) + '.mock';
      saveSession(mockToken, u);
    }
  };

  const saveSession = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;
  const isAdmin         = user?.role === 'ADMIN';
  const isSupervisor    = user?.role === 'SUPERVISOR';
  const isAdminOrSup    = isAdmin || isSupervisor;

  return (
    <AuthContext.Provider value={{
      user, token, lineProfile, liffReady, loading,
      isAuthenticated, isAdmin, isSupervisor, isAdminOrSup,
      handleLineLogin, register, logout, mockLogin, saveSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
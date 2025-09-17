'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  username: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  joinDate: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  signup: (userData: User) => boolean;
  validateLogin: (username: string, password: string) => User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 로그인 상태 확인
    const checkAuthStatus = () => {
      try {
        const loggedInStatus = localStorage.getItem('isLoggedIn');
        const userData = localStorage.getItem('user');
        
        if (loggedInStatus === 'true' && userData) {
          const parsedUser = JSON.parse(userData);
          setIsLoggedIn(true);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // 오류 발생 시 로그아웃 처리
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const signup = (userData: User): boolean => {
    try {
      // 기존 계정들을 localStorage에서 가져오기
      const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      
      // 중복 확인 (username과 email)
      const isDuplicate = existingAccounts.some((account: User) => 
        account.username === userData.username || account.email === userData.email
      );
      
      if (isDuplicate) {
        return false; // 중복된 계정
      }
      
      // 새 계정 추가
      const updatedAccounts = [...existingAccounts, userData];
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      
      return true; // 회원가입 성공
    } catch (error) {
      console.error('Error during signup:', error);
      return false;
    }
  };

  const validateLogin = (username: string, password: string): User | null => {
    try {
      // 테스트 계정 확인
      if (username === "tmdisgood" && password === "12345678") {
        return {
          username: "tmdisgood",
          name: "관리자",
          email: "tmdisgood@example.com",
          joinDate: "2024-01-01"
        };
      }
      
      // 회원가입한 계정들 확인
      const existingAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const account = existingAccounts.find((acc: User) => 
        acc.username === username && acc.password === password
      );
      
      if (account) {
        // 비밀번호는 반환하지 않음
        const { password: _, ...userWithoutPassword } = account;
        return userWithoutPassword;
      }
      
      return null; // 로그인 실패
    } catch (error) {
      console.error('Error during login validation:', error);
      return null;
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('favoriteShelter');
    localStorage.removeItem('recentVisits');
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      user,
      login,
      logout,
      signup,
      validateLogin,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, you would call your backend API to verify the session
        const response = await fetch('/api/auth/session');
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, you would authenticate with your backend
      // For this demo, we'll simulate a successful login
      setTimeout(() => {
        setUser({
          id: 'user123',
          name: 'Plaid Sales Engineer',
          email: 'sales.engineer@plaid.com'
        });
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, you would call your backend API to end the session
      // For this demo, we'll simulate a successful logout
      setTimeout(() => {
        setUser(null);
        setIsLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
    }
  };
  
  return { user, isLoading, login, logout };
};

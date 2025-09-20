import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setLogoutHandler } from '../services/api';

export const useApiLogoutHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => {
      navigate('/login', { replace: true });
    };

    setLogoutHandler(handleLogout);

    // Cleanup function to remove the handler when component unmounts
    return () => {
      setLogoutHandler(null);
    };
  }, [navigate]);
};
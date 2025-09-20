import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  logoutUser,
  validateToken,
  updateUserProfile,
  clearError,
  clearRegistrationSuccess,
  setLoading,
  selectAuth,
  selectUser,
  selectUserType,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectRegistrationSuccess,
} from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const userType = useSelector(selectUserType);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const registrationSuccess = useSelector(selectRegistrationSuccess);

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(validateToken(token));
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch, isAuthenticated]);

  const login = async (email, password, userType) => {
    try {
      const result = await dispatch(loginUser({ email, password, userType }));
      if (loginUser.fulfilled.match(result)) {
        return { success: true };
      } else {
        return { success: false, error: result.payload };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const result = await dispatch(registerUser(userData));
      if (registerUser.fulfilled.match(result)) {
        return { success: true, message: result.payload.message };
      } else {
        return { success: false, error: result.payload };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    dispatch(logoutUser());
  };

  const updateProfile = async (profileData) => {
    try {
      const result = await dispatch(updateUserProfile(profileData));
      if (updateUserProfile.fulfilled.match(result)) {
        return { success: true };
      } else {
        return { success: false, error: result.payload };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const clearRegSuccess = () => {
    dispatch(clearRegistrationSuccess());
  };

  return {
    // State
    user,
    userType,
    isAuthenticated,
    loading,
    error,
    registrationSuccess,
    token: auth.token,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    clearError: clearAuthError,
    clearRegistrationSuccess: clearRegSuccess,
  };
};
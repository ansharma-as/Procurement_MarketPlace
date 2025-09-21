import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('vendor'); // 'vendor' or 'organization'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    businessType: '',
    phone: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let endpoint = '';
      let payload = {};

      if (isLogin) {
        // Login endpoint
        endpoint = 'http://localhost:8080/api/auth/login';
        payload = {
          email: formData.email,
          password: formData.password,
          userType: userType // Include userType context for login
        };
      } else {
        // Registration endpoints
        if (userType === 'vendor') {
          endpoint = 'http://localhost:8080/api/auth/vendor/register';
          payload = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyName: formData.companyName,
            businessType: formData.businessType,
            phone: formData.phone,
            website: formData.website
          };
        } else {
          endpoint = 'http://localhost:8080/api/auth/organization/register';
          payload = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            organizationName: formData.companyName,
            organizationType: formData.businessType,
            phone: formData.phone,
            website: formData.website
          };
        }
      }

      console.log('API Call:', endpoint, payload);
      const response = await axios.post(endpoint, payload);
      console.log('API Response:', response.data);

      if (response.data.success) {
        // Store auth data with user type specific token names
        if (response.data.data.accessToken) {
          const tokenName = userType === 'vendor' ? 'vendor_token' : 'user_token';
          const refreshTokenName = userType === 'vendor' ? 'vendor_refreshToken' : 'user_refreshToken';
          localStorage.setItem(tokenName, response.data.data.accessToken);
          if (response.data.data.refreshToken) {
            localStorage.setItem(refreshTokenName, response.data.data.refreshToken);
          }
        }
        if (response.data.data.user) {
          localStorage.setItem('userType', response.data.data.user.userType);
        }

        // Navigate based on user type
        const userTypeFromResponse = response.data.data.user?.userType;

        if (isLogin) {
          // For login, respect the selected userType from the form
          if (userType === 'vendor') {
            navigate('/vendors');
          } else {
            // organization type includes admin/manager/user roles
            navigate('/organizations');
          }
        } else {
          // For registration, use the actual userType from response
          if (userTypeFromResponse === 'vendor') {
            navigate('/vendors');
          } else {
            navigate('/organizations');
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <button
            className="font-medium text-blue-600 hover:text-blue-500"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isLogin ? 'Login As' : 'Account Type'}
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="userType"
                  value="vendor"
                  checked={userType === 'vendor'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Vendor</div>
                  <div className="text-sm text-gray-500">
                    {isLogin ? 'Login as a vendor to browse opportunities and submit proposals' : 'Register as a vendor/supplier'}
                  </div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="userType"
                  value="user"
                  checked={userType === 'organization'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {isLogin ? 'Organization User' : 'Organization'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isLogin ? 'Login as Admin/Manager/User to manage RFPs and proposals' : 'Register as an organization'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    {userType === 'vendor' ? 'Company Name' : 'Organization Name'}
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                    {userType === 'vendor' ? 'Business Type' : 'Organization Type'}
                  </label>
                  <input
                    id="businessType"
                    name="businessType"
                    type="text"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Create account')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
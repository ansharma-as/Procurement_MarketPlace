import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    proposalUpdates: true,
    marketRequestUpdates: true,
    contractUpdates: true,
    systemUpdates: true,
  });
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    theme: 'light',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => userAPI.update(user._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', user._id]);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data) => userAPI.update(user._id, { notificationSettings: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', user._id]);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => userAPI.update(user._id, { preferences: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', user._id]);
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
    };

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('New passwords do not match');
        return;
      }
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleNotificationsSubmit = (e) => {
    e.preventDefault();
    updateNotificationsMutation.mutate(notifications);
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    updatePreferencesMutation.mutate(preferences);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information and password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.currentPassword}
                              onChange={handleInputChange}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type="password"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {updateProfileMutation.error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {updateProfileMutation.error.response?.data?.message || 'Failed to update profile'}
                        </AlertDescription>
                      </Alert>
                    )}

                    {updateProfileMutation.isSuccess && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Profile updated successfully!
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isLoading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive notifications via email</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">SMS Notifications</p>
                            <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.smsNotifications}
                          onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium text-gray-900 mb-4">Update Types</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Proposal Updates</p>
                            <p className="text-sm text-gray-500">New proposals and status changes</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.proposalUpdates}
                            onChange={(e) => handleNotificationChange('proposalUpdates', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Market Request Updates</p>
                            <p className="text-sm text-gray-500">New market requests and opportunities</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.marketRequestUpdates}
                            onChange={(e) => handleNotificationChange('marketRequestUpdates', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Contract Updates</p>
                            <p className="text-sm text-gray-500">Contract executions and renewals</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.contractUpdates}
                            onChange={(e) => handleNotificationChange('contractUpdates', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">System Updates</p>
                            <p className="text-sm text-gray-500">Platform updates and maintenance</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.systemUpdates}
                            onChange={(e) => handleNotificationChange('systemUpdates', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateNotificationsMutation.isLoading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{updateNotificationsMutation.isLoading ? 'Saving...' : 'Save Preferences'}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Preferences</CardTitle>
                  <CardDescription>
                    Customize your application experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          value={preferences.language}
                          onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                          id="timezone"
                          value={preferences.timezone}
                          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <select
                          id="dateFormat"
                          value={preferences.dateFormat}
                          onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <select
                          id="currency"
                          value={preferences.currency}
                          onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD (C$)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label>Theme</Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={preferences.theme === 'light'}
                            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2">Light</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={preferences.theme === 'dark'}
                            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2">Dark</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="auto"
                            checked={preferences.theme === 'auto'}
                            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2">Auto (system preference)</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updatePreferencesMutation.isLoading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{updatePreferencesMutation.isLoading ? 'Saving...' : 'Save Preferences'}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Database className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Data Export</p>
                          <p className="text-sm text-gray-500">Download a copy of your account data</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="font-medium text-red-800">Delete Account</p>
                          <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
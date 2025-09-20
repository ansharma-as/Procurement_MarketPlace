import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { userAPI, vendorAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Star,
  Award,
  TrendingUp,
  FileText,
  Edit,
  Save,
  Camera,
  Globe,
  Briefcase,
  Users,
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    company: user?.company || '',
    position: user?.position || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  // Fetch user profile data
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-profile', user?._id],
    queryFn: () => userAPI.getById(user._id),
    enabled: !!user?._id,
  });

  // Fetch vendor profile if user is a vendor
  const {
    data: vendorProfileData,
  } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: () => vendorAPI.getProfile(),
    enabled: user?.userType === 'vendor',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => userAPI.update(user._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', user._id]);
      setIsEditing(false);
    },
  });

  const updateVendorProfileMutation = useMutation({
    mutationFn: (data) => vendorAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-profile']);
    },
  });

  const profile = profileData?.data?.data || user;
  const vendorProfile = vendorProfileData?.data?.data;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      company: profile?.company || '',
      position: profile?.position || '',
      location: profile?.location || '',
      website: profile?.website || '',
    });
    setIsEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    ...(user?.userType === 'vendor' ? [{ id: 'vendor', label: 'Vendor Profile' }] : []),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
            <p className="text-gray-600">{error.message || 'Failed to load profile'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <button className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile?.firstName} {profile?.lastName}
                    </h1>
                    <p className="text-gray-600">{profile?.position || user?.role}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant={profile?.status === 'active' ? 'success' : 'secondary'}>
                        {profile?.status || 'Active'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Joined {formatDate(profile?.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isLoading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{updateProfileMutation.isLoading ? 'Saving...' : 'Save'}</span>
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              {user?.userType === 'vendor' && vendorProfile && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{vendorProfile.totalProposals || 0}</p>
                    <p className="text-sm text-gray-600">Proposals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{vendorProfile.awardedContracts || 0}</p>
                    <p className="text-sm text-gray-600">Awarded</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {getRatingStars(vendorProfile.rating)}
                    </div>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {vendorProfile.totalProposals > 0
                        ? `${Math.round((vendorProfile.awardedContracts / vendorProfile.totalProposals) * 100)}%`
                        : '0%'}
                    </p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700">
                          {profile?.bio || 'No bio provided'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="company">Company</Label>
                            <Input
                              id="company"
                              name="company"
                              value={formData.company}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="position">Position</Label>
                            <Input
                              id="position"
                              name="position"
                              value={formData.position}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">Company</h5>
                          <p className="text-gray-600">{profile?.company || 'Not specified'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">Position</h5>
                          <p className="text-gray-600">{profile?.position || 'Not specified'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">Location</h5>
                          <p className="text-gray-600">{profile?.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 mb-1">Website</h5>
                          {profile?.website ? (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                              {profile.website}
                            </a>
                          ) : (
                            <p className="text-gray-600">Not specified</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
              </div>
            )}

            {activeTab === 'activity' && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Submitted proposal for IT Services Request</p>
                        <p className="text-sm text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Won contract for Website Development</p>
                        <p className="text-sm text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Updated profile information</p>
                        <p className="text-sm text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'vendor' && user?.userType === 'vendor' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vendor Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Capabilities</h5>
                        <div className="flex flex-wrap gap-2">
                          {vendorProfile?.capabilities && vendorProfile.capabilities.length > 0 ? (
                            vendorProfile.capabilities.map((capability, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                                {capability}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500">No capabilities listed</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Certifications</h5>
                        {vendorProfile?.certifications && vendorProfile.certifications.length > 0 ? (
                          <div className="space-y-2">
                            {vendorProfile.certifications.map((cert, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">{cert.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No certifications listed</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">On-time Delivery</h5>
                        <p className="text-gray-600">{vendorProfile?.onTimeDeliveryRate || 0}%</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Quality Score</h5>
                        <p className="text-gray-600">{vendorProfile?.qualityScore || 0}/10</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Response Time</h5>
                        <p className="text-gray-600">{vendorProfile?.avgResponseTime || 'N/A'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Repeat Business</h5>
                        <p className="text-gray-600">{vendorProfile?.repeatBusinessRate || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
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
                      <Label htmlFor="phone">Phone</Label>
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
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{profile?.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{profile?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    {profile?.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-gray-600">{profile.location}</p>
                        </div>
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Website</p>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-500">
                            {profile.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-gray-600">{user?.role || 'User'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">User Type</p>
                      <p className="text-sm text-gray-600">{user?.userType || 'internal'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-gray-600">{formatDate(profile?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
// Using basic HTML elements instead of custom components
import {
  Search,
  ArrowRight,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  Star,
  CheckCircle,
  Globe,
  Zap,
  Award,
  FileText,
  Clock,
  Target
} from 'lucide-react';

const MarketplaceLanding = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch latest market requests for preview
  const { data: previewOpportunities } = useQuery({
    queryKey: ['preview-market-requests'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8080/api/market-requests', {
        params: {
          page: 1,
          limit: 6,
          status: 'open',
          sortBy: 'deadline',
          sortOrder: 'asc'
        }
      });
      console.log('Market Requests API Response:', response.data);
      return response.data;
    },
  });

  const opportunities = Array.isArray(previewOpportunities?.data?.requests) ? previewOpportunities.data.requests : [];

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // For now, just filter the current data - you can implement search later
      console.log('Searching for:', searchTerm);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Budget TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const stats = [
    { icon: FileText, label: 'Active Opportunities', value: '250+', color: 'text-blue-600' },
    { icon: Users, label: 'Registered Vendors', value: '1,200+', color: 'text-green-600' },
    { icon: DollarSign, label: 'Contract Value', value: '$15M+', color: 'text-purple-600' },
    { icon: Award, label: 'Successful Projects', value: '850+', color: 'text-orange-600' },
  ];

  const features = [
    {
      icon: Search,
      title: 'Smart Matching',
      description: 'AI-powered matching between procurement needs and vendor capabilities'
    },
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'End-to-end encryption and verified vendor credentials'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Track performance, costs, and market trends with advanced analytics'
    },
    {
      icon: Globe,
      title: 'Global Network',
      description: 'Connect with verified vendors and buyers worldwide'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Streamlined procurement process from RFP to contract signing'
    },
    {
      icon: CheckCircle,
      title: 'Quality Assurance',
      description: 'Comprehensive vendor verification and quality control systems'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Procurement Director',
      company: 'TechCorp Solutions',
      avatar: 'SJ',
      quote: 'This platform reduced our procurement cycle time by 60% while improving vendor quality.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Vendor Manager',
      company: 'EliteSupply Co.',
      avatar: 'MC',
      quote: 'Easy to find relevant opportunities and submit competitive proposals.',
      rating: 5
    },
    {
      name: 'Lisa Rodriguez',
      role: 'Operations Manager',
      company: 'GlobalTech Inc.',
      avatar: 'LR',
      quote: 'The AI evaluation system helps us make better, data-driven vendor selections.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ProcureMarket</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/vendors" className="text-gray-600 hover:text-gray-900">Vendor Portal</Link>
              <Link to="/organizations" className="text-gray-600 hover:text-gray-900">Organization Portal</Link>
              <div className="flex items-center space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              The Future of
              <span className="text-blue-600 block">Procurement</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Browse market requests from organizations and submit competitive proposals.
              Grow your business with our AI-powered procurement marketplace.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search market requests, categories, or organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-md w-full"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  className="h-14 px-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg flex items-center justify-center"
                onClick={() => navigate('/vendors')}
              >
                <Users className="h-5 w-5 mr-2" />
                Join as Vendor
              </button>
              <button
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-lg flex items-center justify-center"
                onClick={() => navigate('/organizations')}
              >
                <Building2 className="h-5 w-5 mr-2" />
                Post Market Requests
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <Icon className={`h-8 w-8 ${stat.color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Market Requests */}
      {opportunities.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Latest Market Requests
              </h2>
              <p className="text-xl text-gray-600">
                Discover procurement opportunities from verified organizations
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {opportunities.slice(0, 6).map((opportunity) => (
                <div key={opportunity._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {opportunity.title}
                      </h3>
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {opportunity.category || 'General'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {opportunity.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(opportunity.maxBudget)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'Open'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <span>Qty: {opportunity.quantity}</span>
                      <span>{opportunity.proposals?.length || 0} proposals</span>
                    </div>

                    <button
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center justify-center"
                      onClick={() => navigate(`/vendors`)}
                    >
                      View Details & Submit Proposal
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg flex items-center justify-center"
                onClick={() => navigate('/vendors')}
              >
                View All Market Requests
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ProcureMarket?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for modern procurement needs with cutting-edge technology and proven processes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers say about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-gray-500">{testimonial.company}</div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Procurement?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of buyers and vendors already using our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="px-8 py-3 bg-white text-blue-600 rounded-md hover:bg-gray-50 text-lg flex items-center justify-center border border-blue-200"
              onClick={() => navigate('/vendors')}
            >
              <Users className="h-5 w-5 mr-2" />
              Start Selling
            </button>
            <button
              className="px-8 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 text-lg flex items-center justify-center"
              onClick={() => navigate('/organizations')}
            >
              <Building2 className="h-5 w-5 mr-2" />
              Start Buying
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">ProcureMarket</span>
              </div>
              <p className="text-gray-400 mb-4">
                The leading procurement marketplace connecting buyers and vendors worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/opportunities" className="hover:text-white">Browse Market Requests</Link></li>
                <li><Link to="/vendors" className="hover:text-white">Find Vendors</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How it Works</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ProcureMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketplaceLanding;
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { marketRequestAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const createRequirementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  category: z.string().min(1, 'Category is required'),
  budget: z.number().min(1, 'Budget must be greater than 0').optional(),
  deadline: z.string().optional(),
  requirements: z.string().min(1, 'Requirements are required'),
  specifications: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high'], { required_error: 'Urgency is required' }),
  justification: z.string().min(1, 'Business justification is required'),
});

const CreateRequirement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitAsStatus, setSubmitAsStatus] = useState('draft');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(createRequirementSchema),
    defaultValues: {
      urgency: 'medium',
      category: '',
    }
  });

  const createMutation = useMutation({
    mutationFn: marketRequestAPI.create,
    onSuccess: (response) => {
      const requirementId = response.data.data._id;
      navigate(`/requirements/${requirementId}`);
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      status: submitAsStatus,
      budget: data.budget ? Number(data.budget) : undefined,
      deadline: data.deadline || undefined,
      type: 'internal_requirement', // Mark as internal requirement vs marketplace request
    };

    createMutation.mutate(payload);
  };

  const handleSaveDraft = () => {
    setSubmitAsStatus('draft');
  };

  const handleSubmitForApproval = () => {
    setSubmitAsStatus('pending');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/requirements')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Requirements</span>
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Requirement</h1>
            <p className="mt-2 text-gray-600">
              Create a procurement requirement that will be reviewed by your manager before being published to the marketplace
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {createMutation.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {createMutation.error.response?.data?.message || 'Failed to create requirement'}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Provide the basic details for your procurement requirement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter requirement title (e.g., 'New Laptops for Development Team')"
                  {...register('title')}
                  className="mt-1"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Describe what you need and why you need it"
                  {...register('description')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    {...register('category')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="IT">Information Technology</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Services">Professional Services</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Construction">Construction</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="urgency">Urgency *</Label>
                  <select
                    id="urgency"
                    {...register('urgency')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  {errors.urgency && (
                    <p className="mt-1 text-sm text-red-600">{errors.urgency.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Budget and Timeline</span>
              </CardTitle>
              <CardDescription>
                Specify the budget and timeline for this requirement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="budget">Estimated Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Enter estimated budget"
                    {...register('budget', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.budget && (
                    <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Leave empty if budget is to be determined</p>
                </div>

                <div>
                  <Label htmlFor="deadline">Required By (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    {...register('deadline')}
                    className="mt-1"
                  />
                  {errors.deadline && (
                    <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements and Justification */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements and Business Justification</CardTitle>
              <CardDescription>
                Detail the specific requirements and explain why this procurement is needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="requirements">Detailed Requirements *</Label>
                <textarea
                  id="requirements"
                  rows={4}
                  placeholder="List the specific requirements, features, or specifications needed"
                  {...register('requirements')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.requirements && (
                  <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="specifications">Technical Specifications (Optional)</Label>
                <textarea
                  id="specifications"
                  rows={4}
                  placeholder="Include technical specifications, standards, or compliance requirements"
                  {...register('specifications')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.specifications && (
                  <p className="mt-1 text-sm text-red-600">{errors.specifications.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="justification">Business Justification *</Label>
                <textarea
                  id="justification"
                  rows={3}
                  placeholder="Explain why this procurement is necessary and how it will benefit the organization"
                  {...register('justification')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.justification && (
                  <p className="mt-1 text-sm text-red-600">{errors.justification.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/requirements')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting || createMutation.isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save as Draft</span>
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitForApproval}
              disabled={isSubmitting || createMutation.isLoading}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit for Approval</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequirement;
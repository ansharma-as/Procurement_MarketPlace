import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { marketRequestAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Calendar,
  DollarSign
} from 'lucide-react';

const requirementSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  mandatory: z.boolean(),
  weight: z.number().min(0).max(100).optional(),
});

const rfpSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['rfp', 'rfq', 'rfi']),
  category: z.string().min(1, 'Category is required'),
  estimatedValue: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  submissionDeadline: z.string().min(1, 'Submission deadline is required'),
  evaluationCriteria: z.string().optional(),
  contractType: z.string().optional(),
  projectDuration: z.string().optional(),
  location: z.string().optional(),
  requirements: z.array(requirementSchema).optional(),
});

const CreateMarketRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDraft, setIsDraft] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(rfpSchema),
    defaultValues: {
      type: 'rfp',
      currency: 'USD',
      requirements: [
        { category: 'Technical Requirements', description: '', mandatory: true, weight: 50 },
        { category: 'Commercial Requirements', description: '', mandatory: true, weight: 30 },
        { category: 'Company Qualifications', description: '', mandatory: true, weight: 20 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requirements',
  });

  const createMutation = useMutation({
    mutationFn: (data) => marketRequestAPI.create(data),
    onSuccess: (response) => {
      const marketRequestId = response.data.data._id;
      navigate(`/market-requests/${marketRequestId}`);
    },
  });

  const watchType = watch('type');

  const onSubmit = async (data) => {
    try {
      const marketRequestData = {
        ...data,
        status: isDraft ? 'draft' : 'published',
        budget: data.estimatedValue || 0,
        deadline: new Date(data.submissionDeadline).toISOString(),
      };

      createMutation.mutate(marketRequestData);
    } catch (error) {
      console.error('Failed to create market request:', error);
    }
  };

  const handleSaveAsDraft = () => {
    setIsDraft(true);
    handleSubmit(onSubmit)();
  };

  const handlePublish = () => {
    setIsDraft(false);
    handleSubmit(onSubmit)();
  };

  const addRequirement = () => {
    append({
      category: '',
      description: '',
      mandatory: false,
      weight: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/market-requests')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Market Requests
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Market Request</h1>
              <p className="text-gray-600 mt-1">
                Create a market request to source vendors for your project
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the essential details about your market request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Office Equipment Procurement"
                    {...register('title')}
                    className="mt-1"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    {...register('type')}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="rfp">Request for Proposal (RFP)</option>
                    <option value="rfq">Request for Quotation (RFQ)</option>
                    <option value="rfi">Request for Information (RFI)</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Provide a detailed description of what you're looking for..."
                  {...register('description')}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a category</option>
                    <option value="it_services">IT Services</option>
                    <option value="construction">Construction</option>
                    <option value="consulting">Consulting</option>
                    <option value="equipment">Equipment</option>
                    <option value="supplies">Supplies</option>
                    <option value="marketing">Marketing</option>
                    <option value="legal">Legal Services</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY or Remote"
                    {...register('location')}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Information
              </CardTitle>
              <CardDescription>
                Provide budget and financial details for the project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="estimatedValue">Estimated Value</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    placeholder="0"
                    {...register('estimatedValue', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.estimatedValue && (
                    <p className="mt-1 text-sm text-red-600">{errors.estimatedValue.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    {...register('currency')}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contractType">Contract Type</Label>
                  <select
                    id="contractType"
                    {...register('contractType')}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select contract type</option>
                    <option value="fixed_price">Fixed Price</option>
                    <option value="time_materials">Time & Materials</option>
                    <option value="cost_plus">Cost Plus</option>
                    <option value="retainer">Retainer</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="projectDuration">Project Duration</Label>
                  <Input
                    id="projectDuration"
                    placeholder="e.g., 6 months, 1 year"
                    {...register('projectDuration')}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
              <CardDescription>
                Set important dates for the procurement process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                  <Input
                    id="submissionDeadline"
                    type="datetime-local"
                    {...register('submissionDeadline')}
                    className="mt-1"
                  />
                  {errors.submissionDeadline && (
                    <p className="mt-1 text-sm text-red-600">{errors.submissionDeadline.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Requirements & Specifications</CardTitle>
                  <CardDescription>
                    Define the specific requirements for vendors
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequirement}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-gray-900">Requirement {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor={`requirements.${index}.category`}>Category</Label>
                        <Input
                          {...register(`requirements.${index}.category`)}
                          placeholder="e.g., Technical Requirements"
                          className="mt-1"
                        />
                        {errors.requirements?.[index]?.category && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.requirements[index].category.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`requirements.${index}.weight`}>Weight (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...register(`requirements.${index}.weight`, { valueAsNumber: true })}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label htmlFor={`requirements.${index}.description`}>Description</Label>
                      <textarea
                        {...register(`requirements.${index}.description`)}
                        placeholder="Describe the specific requirements..."
                        rows={3}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.requirements?.[index]?.description && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.requirements[index].description.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`requirements.${index}.mandatory`)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-900">
                        This is a mandatory requirement
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evaluation Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Criteria</CardTitle>
              <CardDescription>
                Explain how proposals will be evaluated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="evaluationCriteria">Evaluation Criteria</Label>
                <textarea
                  id="evaluationCriteria"
                  rows={4}
                  placeholder="Describe how you will evaluate the proposals..."
                  {...register('evaluationCriteria')}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {createMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {createMutation.error.response?.data?.message || 'Failed to create market request. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/market-requests')}
            >
              Cancel
            </Button>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting || createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting && isDraft ? 'Saving...' : 'Save as Draft'}
              </Button>

              <Button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting || createMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting && !isDraft ? 'Publishing...' : 'Publish Market Request'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMarketRequest;
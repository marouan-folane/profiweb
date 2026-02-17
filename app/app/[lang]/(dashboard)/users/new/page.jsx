"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // FIXED: Changed from next/router to next/navigation
import { useMutation } from '@tanstack/react-query';
import { createUser } from '@/config/functions/admin';
import { toast } from 'sonner';

const CreateUserForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    terms: false
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => createUser(userData),
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(data.message || 'User created successfully!');

        // Reset form
        setFormData({
          username: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: '',
          terms: false
        });

        // Optional: Redirect to users list
        router.push('/users'); // Adjust the route as needed
      } else {
        toast.error(data.message || 'Failed to create user');
      }
    },
    onError: (error) => {
      console.error('Create user error:', error);

      // Handle specific error messages from backend
      if (error?.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else if (error?.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('An error occurred while creating the user. Please try again.');
      }
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.terms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    // Validate all required fields
    const requiredFields = ['username', 'firstName', 'lastName', 'email', 'password', 'role'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Prepare data for API
    const userData = {
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      password: formData.password,
      passwordConfirm: formData.password,
      role: formData.role,
    };

    // Call the mutation
    createUserMutation.mutate(userData);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Create New User</h2>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create a new user account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div className="md:col-span-2">
            <Label htmlFor="username" className="mb-2 block">
              Username *
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full"
              disabled={createUserMutation.isPending}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Username must be unique and contain only letters, numbers, and underscores.
            </p>
          </div>

          {/* First Name */}
          <div>
            <Label htmlFor="firstName" className="mb-2 block">
              First Name *
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              disabled={createUserMutation.isPending}
            />
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="lastName" className="mb-2 block">
              Last Name *
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              disabled={createUserMutation.isPending}
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <Label htmlFor="email" className="mb-2 block">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={createUserMutation.isPending}
            />
          </div>

          {/* Phone */}
          <div className="md:col-span-2">
            <Label htmlFor="phone" className="mb-2 block">
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="1 (555) 123-4567"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={createUserMutation.isPending}
            />
          </div>

          {/* Role Selection */}
          <div className="md:col-span-2">
            <Label htmlFor="role" className="mb-2 block">
              Select Role *
            </Label>
            <Select
              onValueChange={handleSelectChange}
              value={formData.role}
              disabled={createUserMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="d.s">Department Sales</SelectItem>
                <SelectItem value="d.i">Department Information</SelectItem>
                <SelectItem value="d.c">Department Content</SelectItem>
                <SelectItem value="d.d">Department Design</SelectItem>
                <SelectItem value="d.it">Department IT</SelectItem>
                <SelectItem value="d.in">Department Integration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password Field with Visibility Toggle */}
          <div className="md:col-span-2">
            <Label htmlFor="password" className="mb-2 block">
              Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={createUserMutation.isPending}
                className="pr-10" // Add padding for the eye icon
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createUserMutation.isPending}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-eye-off"
                  >
                    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                    <path d="m2 2 20 20" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-eye"
                  >
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">
                Password must be at least 8 characters long and include uppercase, lowercase, and numbers.
              </p>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createUserMutation.isPending}
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator (Optional) */}
          {formData.password.length > 0 && (
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="text-sm font-medium text-gray-700">Password strength:</div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        formData.password.length < 6 ? 'bg-red-500 w-1/4' :
                        formData.password.length < 8 ? 'bg-yellow-500 w-1/2' :
                        /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) && /[0-9]/.test(formData.password) 
                          ? 'bg-green-500 w-full' 
                          : 'bg-orange-500 w-3/4'
                      }`}
                    />
                  </div>
                </div>
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg className={`w-3 h-3 mr-1 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={formData.password.length >= 8 ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                  At least 8 characters
                </li>
                <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg className={`w-3 h-3 mr-1 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={/[A-Z]/.test(formData.password) ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                  Uppercase letter
                </li>
                <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg className={`w-3 h-3 mr-1 ${/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={/[a-z]/.test(formData.password) ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                  Lowercase letter
                </li>
                <li className={`flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg className={`w-3 h-3 mr-1 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={/[0-9]/.test(formData.password) ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                  </svg>
                  Number
                </li>
              </ul>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="md:col-span-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                name="terms"
                checked={formData.terms}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, terms: checked }))
                }
                disabled={createUserMutation.isPending}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm that I have permission to create this user account *
                </Label>
                <p className="text-sm text-muted-foreground">
                  By checking this box, you agree that all provided information is accurate and
                  you have obtained necessary consent where required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit and Reset Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                username: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                role: '',
                terms: false
              });
              setShowPassword(false); // Also reset password visibility
            }}
            disabled={createUserMutation.isPending}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={!formData.terms || createUserMutation.isPending}
            className="min-w-[120px]"
          >
            {createUserMutation.isPending ? (
              <>
                <span className="mr-2">Creating...</span>
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateUserForm;

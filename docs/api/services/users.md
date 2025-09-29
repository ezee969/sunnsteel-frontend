# User Service API

## Overview

The User Service manages user profile information and account-related operations in the Sunsteel fitness application. This service provides access to user profile data, preferences, and account management functionality through Supabase integration.

## Base Configuration

```typescript
const USERS_API_URL = '/users';
```

All endpoints require authentication via Supabase session token.

## Endpoints

### Get User Profile

Retrieve the current user's profile information.

#### Request

```http
GET /users/profile
```

#### Example Request

```typescript
const profile = await userService.getProfile();
```

#### Response

```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  heightCm?: number;
  weightKg?: number;
  fitnessLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  goals?: string[];
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

interface UserPreferences {
  units: 'METRIC' | 'IMPERIAL';
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  language: string;
  notifications: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    socialActivity: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
    workoutVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
    statsVisibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  };
}
```

#### Status Codes

- `200`: Success
- `401`: Unauthorized
- `404`: User profile not found
- `500`: Internal Server Error

## Service Implementation

### TypeScript Service

```typescript
import { httpClient } from './httpClient';
import { UserProfile } from '../types/user.type';

export const userService = {
  /**
   * Get the current user's profile
   * @returns Promise<UserProfile> User profile data
   */
  async getProfile(): Promise<UserProfile> {
    return httpClient.request<UserProfile>('/users/profile', {
      method: 'GET',
      secure: true,
    });
  },

  /**
   * Update user profile
   * @param data Partial user profile data to update
   * @returns Promise<UserProfile> Updated user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return httpClient.request<UserProfile>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
      secure: true,
    });
  },

  /**
   * Update user preferences
   * @param preferences User preferences to update
   * @returns Promise<UserProfile> Updated user profile with new preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserProfile> {
    return httpClient.request<UserProfile>('/users/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
      secure: true,
    });
  },

  /**
   * Upload user avatar
   * @param file Avatar image file
   * @returns Promise<{ avatarUrl: string }> New avatar URL
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return httpClient.request<{ avatarUrl: string }>('/users/avatar', {
      method: 'POST',
      body: formData,
      secure: true,
      // Don't set Content-Type for FormData - let browser set it
    });
  },

  /**
   * Delete user account
   * @returns Promise<void>
   */
  async deleteAccount(): Promise<void> {
    return httpClient.request<void>('/users/account', {
      method: 'DELETE',
      secure: true,
    });
  },
};
```

## React Query Integration

### Hook Implementation

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { usePerformanceQuery } from '@/hooks/use-performance-query';

export const userKeys = {
  all: ['users'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

/**
 * Hook to get current user profile
 */
export const useUserProfile = (options?: { enabled?: boolean }) => {
  return usePerformanceQuery({
    queryKey: userKeys.profile(),
    queryFn: userService.getProfile,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  }, 'User Profile Load');
};

/**
 * Hook to update user profile
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (updatedProfile) => {
      // Update the profile cache
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
    },
    onError: (error) => {
      console.error('Failed to update user profile:', error);
    },
  });
};

/**
 * Hook to update user preferences
 */
export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updatePreferences,
    onSuccess: (updatedProfile) => {
      // Update the profile cache with new preferences
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
    },
    onError: (error) => {
      console.error('Failed to update user preferences:', error);
    },
  });
};

/**
 * Hook to upload user avatar
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: (result) => {
      // Update the profile cache with new avatar URL
      queryClient.setQueryData<UserProfile>(
        userKeys.profile(),
        (oldProfile) => {
          if (!oldProfile) return oldProfile;
          return {
            ...oldProfile,
            avatarUrl: result.avatarUrl,
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
    onError: (error) => {
      console.error('Failed to upload avatar:', error);
    },
  });
};
```

## Usage Patterns

### Basic Profile Management

```typescript
function UserProfilePage() {
  const { data: profile, isLoading, error } = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) return <ProfileSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!profile) return <div>No profile found</div>;

  return (
    <div>
      <ProfileHeader profile={profile} />
      <ProfileForm 
        profile={profile} 
        onSubmit={handleUpdateProfile}
        isLoading={updateProfileMutation.isPending}
      />
    </div>
  );
}
```

### Preferences Management

```typescript
function UserPreferencesPage() {
  const { data: profile } = useUserProfile();
  const updatePreferencesMutation = useUpdateUserPreferences();

  const handleUpdatePreferences = async (preferences: Partial<UserPreferences>) => {
    try {
      await updatePreferencesMutation.mutateAsync(preferences);
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h1>User Preferences</h1>
      
      <PreferencesForm
        preferences={profile.preferences}
        onSubmit={handleUpdatePreferences}
        isLoading={updatePreferencesMutation.isPending}
      />
    </div>
  );
}
```

### Avatar Upload

```typescript
function AvatarUpload({ currentAvatarUrl }: Props) {
  const uploadAvatarMutation = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Failed to upload avatar');
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        <img 
          src={currentAvatarUrl || '/default-avatar.png'} 
          alt="User avatar"
          className="w-24 h-24 rounded-full object-cover"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatarMutation.isPending}
          className="avatar-upload-button"
        >
          {uploadAvatarMutation.isPending ? 'Uploading...' : 'Change Avatar'}
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
```

### Profile Completion Check

```typescript
function useProfileCompletion() {
  const { data: profile } = useUserProfile();

  return useMemo(() => {
    if (!profile) return { isComplete: false, completionPercentage: 0, missingFields: [] };

    const requiredFields = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'heightCm',
      'weightKg',
      'fitnessLevel'
    ];

    const completedFields = requiredFields.filter(field => 
      profile[field as keyof UserProfile] != null
    );

    const missingFields = requiredFields.filter(field => 
      profile[field as keyof UserProfile] == null
    );

    const completionPercentage = Math.round(
      (completedFields.length / requiredFields.length) * 100
    );

    return {
      isComplete: missingFields.length === 0,
      completionPercentage,
      missingFields,
      completedFields: completedFields.length,
      totalFields: requiredFields.length,
    };
  }, [profile]);
}

// Usage in component
function ProfileCompletionBanner() {
  const { isComplete, completionPercentage, missingFields } = useProfileCompletion();

  if (isComplete) return null;

  return (
    <div className="profile-completion-banner">
      <div className="flex items-center justify-between">
        <div>
          <h3>Complete Your Profile</h3>
          <p>Your profile is {completionPercentage}% complete</p>
        </div>
        <div className="completion-progress">
          <CircularProgress value={completionPercentage} />
        </div>
      </div>
      
      <div className="missing-fields">
        <p>Missing fields: {missingFields.join(', ')}</p>
        <Button onClick={() => router.push('/profile/edit')}>
          Complete Profile
        </Button>
      </div>
    </div>
  );
}
```

## Form Validation

### Profile Form Schema

```typescript
import { z } from 'zod';

export const userProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  displayName: z.string().max(50).optional(),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13 && age <= 120;
  }, 'Age must be between 13 and 120 years'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  heightCm: z.number().min(100, 'Height must be at least 100cm').max(250, 'Height must be less than 250cm').optional(),
  weightKg: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be less than 300kg').optional(),
  fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  goals: z.array(z.string()).max(5, 'Maximum 5 goals allowed').optional(),
});

export const userPreferencesSchema = z.object({
  units: z.enum(['METRIC', 'IMPERIAL']),
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
  language: z.string().min(2).max(5),
  notifications: z.object({
    workoutReminders: z.boolean(),
    progressUpdates: z.boolean(),
    socialActivity: z.boolean(),
    marketing: z.boolean(),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    workoutVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
    statsVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
  }),
});
```

### Form Implementation

```typescript
function ProfileEditForm({ profile, onSubmit }: Props) {
  const form = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      displayName: profile.displayName || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      fitnessLevel: profile.fitnessLevel,
      goals: profile.goals || [],
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...form.register('firstName')}
            error={form.formState.errors.firstName?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...form.register('lastName')}
            error={form.formState.errors.lastName?.message}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          {...form.register('dateOfBirth')}
          error={form.formState.errors.dateOfBirth?.message}
        />
      </div>

      <div>
        <Label htmlFor="gender">Gender</Label>
        <Select
          value={form.watch('gender')}
          onValueChange={(value) => form.setValue('gender', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
            <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="heightCm">Height (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            {...form.register('heightCm', { valueAsNumber: true })}
            error={form.formState.errors.heightCm?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input
            id="weightKg"
            type="number"
            step="0.1"
            {...form.register('weightKg', { valueAsNumber: true })}
            error={form.formState.errors.weightKg?.message}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="fitnessLevel">Fitness Level</Label>
        <Select
          value={form.watch('fitnessLevel')}
          onValueChange={(value) => form.setValue('fitnessLevel', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select fitness level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BEGINNER">Beginner</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
            <SelectItem value="ADVANCED">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}
```

## Error Handling

### Service Error Handling

```typescript
try {
  const profile = await userService.getProfile();
  return profile;
} catch (error) {
  if (error.message.includes('404')) {
    // Handle profile not found
    throw new Error('User profile not found. Please complete your profile setup.');
  } else if (error.message.includes('401')) {
    // Handle authentication error
    throw new Error('Authentication required. Please log in again.');
  } else if (error.message.includes('413')) {
    // Handle file too large (for avatar upload)
    throw new Error('File size too large. Please choose a smaller image.');
  } else {
    // Handle other errors
    throw new Error('Failed to load user profile. Please try again.');
  }
}
```

### Component Error Handling

```typescript
function UserProfilePage() {
  const { data: profile, error, isLoading, refetch } = useUserProfile();

  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to Load Profile</h2>
        <p>{error.message}</p>
        <div className="error-actions">
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push('/profile/setup')}>
            Complete Profile Setup
          </Button>
        </div>
      </div>
    );
  }

  // ... rest of component
}
```

## Testing

### Service Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import { httpClient } from './httpClient';

vi.mock('./httpClient');

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get user profile', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    };

    vi.mocked(httpClient.request).mockResolvedValue(mockProfile);

    const result = await userService.getProfile();

    expect(result).toEqual(mockProfile);
    expect(httpClient.request).toHaveBeenCalledWith('/users/profile', {
      method: 'GET',
      secure: true,
    });
  });

  it('should update user profile', async () => {
    const updateData = { firstName: 'Jane', lastName: 'Smith' };
    const updatedProfile = { id: 'user-123', ...updateData };

    vi.mocked(httpClient.request).mockResolvedValue(updatedProfile);

    const result = await userService.updateProfile(updateData);

    expect(result).toEqual(updatedProfile);
    expect(httpClient.request).toHaveBeenCalledWith('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      secure: true,
    });
  });

  it('should upload avatar', async () => {
    const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
    const mockResponse = { avatarUrl: 'https://example.com/avatar.jpg' };

    vi.mocked(httpClient.request).mockResolvedValue(mockResponse);

    const result = await userService.uploadAvatar(mockFile);

    expect(result).toEqual(mockResponse);
    expect(httpClient.request).toHaveBeenCalledWith('/users/avatar', {
      method: 'POST',
      body: expect.any(FormData),
      secure: true,
    });
  });
});
```

### Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserProfile, useUpdateUserProfile } from './useUser';
import { userService } from '../services/userService';

vi.mock('../services/userService');

describe('useUserProfile', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch user profile successfully', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useUserProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockProfile);
    expect(result.current.error).toBeNull();
  });

  it('should handle profile update', async () => {
    const mockProfile = { id: 'user-123', firstName: 'Jane' };
    vi.mocked(userService.updateProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

    result.current.mutate({ firstName: 'Jane' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProfile);
  });
});
```

## Integration Examples

### Profile Setup Wizard

```typescript
function ProfileSetupWizard() {
  const [step, setStep] = useState(1);
  const updateProfileMutation = useUpdateUserProfile();
  const { data: profile } = useUserProfile();

  const handleStepComplete = async (stepData: Partial<UserProfile>) => {
    try {
      await updateProfileMutation.mutateAsync(stepData);
      setStep(step + 1);
    } catch (error) {
      toast.error('Failed to save profile data');
    }
  };

  return (
    <div className="profile-setup-wizard">
      <ProgressIndicator currentStep={step} totalSteps={4} />
      
      {step === 1 && (
        <BasicInfoStep 
          profile={profile}
          onComplete={handleStepComplete}
        />
      )}
      
      {step === 2 && (
        <PhysicalInfoStep 
          profile={profile}
          onComplete={handleStepComplete}
        />
      )}
      
      {step === 3 && (
        <FitnessGoalsStep 
          profile={profile}
          onComplete={handleStepComplete}
        />
      )}
      
      {step === 4 && (
        <PreferencesStep 
          profile={profile}
          onComplete={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}
```

### User Context Provider

```typescript
function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading, error } = useUserProfile();

  const contextValue = useMemo(() => ({
    profile,
    isLoading,
    error,
    isProfileComplete: profile ? checkProfileCompletion(profile) : false,
  }), [profile, isLoading, error]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
```

## Future Enhancements

### Potential API Extensions

```typescript
// Future endpoint possibilities
interface UserServiceExtensions {
  // Get user statistics
  getUserStats(): Promise<UserStats>;
  
  // Update user goals
  updateGoals(goals: string[]): Promise<UserProfile>;
  
  // Get user activity feed
  getActivityFeed(params?: ActivityFeedParams): Promise<ActivityFeed>;
  
  // Export user data
  exportUserData(format: 'json' | 'csv'): Promise<Blob>;
  
  // Deactivate account (soft delete)
  deactivateAccount(): Promise<void>;
  
  // Get user achievements
  getAchievements(): Promise<Achievement[]>;
}

interface UserStats {
  totalWorkouts: number;
  totalRoutines: number;
  streakDays: number;
  favoriteExercises: string[];
  progressMetrics: ProgressMetric[];
}
```

## Related Documentation

- [Authentication Service](./authentication.md) - For user authentication
- [API Types](../types/user-types.md) - Type definitions
- [React Query Hooks](../../hooks/api-hooks/use-user.md) - Hook usage patterns
- [Form Validation](../../forms/validation-schemas.md) - Validation schemas
- [File Upload](../../features/file-upload.md) - Avatar upload implementation

---

*For implementation details and advanced usage patterns, refer to the source code in `lib/api/services/userService.ts`.*
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/api/hooks/useUser';
import { useUpdateUser } from '@/lib/api/hooks/useUpdateUser';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const { user, isLoading } = useUser();
  const updateUserMutation = useUpdateUser();
  const { push } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    age: '',
    sex: '',
    weight: '',
    height: '',
  });

  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        lastName: user.lastName || '',
        age: user.age ? String(user.age) : '',
        sex: user.sex || '',
        weight: user.weight ? String(user.weight) : '',
        height: user.height ? String(user.height) : '',
      });
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (val: string, name: string) => {
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      const file = event.target.files[0];

      // Validation: Max 2MB
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB.');
      }

      // Validation: Must be an image
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload a valid image file.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      
      // Immediately save URL to user profile
      updateUserMutation.mutate({ avatarUrl: data.publicUrl }, {
        onSuccess: () => {
          // Could dispatch a toast notification
        }
      });

    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      push({
        title: 'Error',
        description: (error as Error).message || 'Error uploading avatar. Are you sure the "avatars" bucket is public and created?',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate({
      name: formData.name,
      lastName: formData.lastName || null,
      age: formData.age ? parseInt(formData.age, 10) : null,
      sex: formData.sex ? (formData.sex as 'MALE' | 'FEMALE') : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      avatarUrl: avatarUrl || null,
    }, {
      onSuccess: () => {
        push({
          title: 'Success',
          description: 'Profile saved successfully.',
          variant: 'success',
        });
      },
      onError: (err) => {
        push({
          title: 'Error',
          description: 'Error saving profile: ' + err.message,
          variant: 'destructive',
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 slide-in-bottom">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 heading-classical">
          Profile Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your account settings and set your preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <Card className="border-amber-500/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your avatar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-amber-500/20 shadow-lg transition-transform group-hover:scale-105">
                <AvatarImage src={avatarUrl || ''} className="object-cover" />
                <AvatarFallback className="text-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer backdrop-blur-[2px] transition-all"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-8 w-8" />}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadAvatar}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click the image to upload a new avatar. Next.js & Supabase edge optimized.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-card/50 backdrop-blur-sm shadow-xl shadow-amber-900/5">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details here.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="bg-background/50" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted cursor-not-allowed text-muted-foreground border-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" min="10" max="120" value={formData.age} onChange={handleInputChange} className="bg-background/50" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sex">Biological Sex</Label>
                  <Select value={formData.sex} onValueChange={(val) => handleSelectChange(val, 'sex')}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="weight">Weight ({user?.weightUnit || 'KG'})</Label>
                  <Input id="weight" name="weight" type="number" step="0.1" value={formData.weight} onChange={handleInputChange} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" name="height" type="number" step="0.1" value={formData.height} onChange={handleInputChange} className="bg-background/50" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white min-w-[120px] shadow-md transition-all hover:scale-[1.02]"
                >
                  {updateUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

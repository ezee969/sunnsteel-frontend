'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import {
  useSupabaseMigrateUser,
  useSupabaseSignUp,
} from '@/lib/api/hooks/useSupabaseAuth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert-dialog';

const migrationSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    oldPassword: z.string().min(1, 'Password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  });

type MigrationFormValues = z.infer<typeof migrationSchema>;

export default function MigratePage() {
  const [step, setStep] = useState<'validate' | 'migrate' | 'success'>('validate');
  const [userInfo, setUserInfo] = useState<{ email: string; userId: string } | null>(
    null
  );

  const {
    mutate: validateUser,
    isPending: isValidating,
    error: validateError,
  } = useSupabaseMigrateUser();
  const {
    mutate: signUp,
    isPending: isMigrating,
    error: migrateError,
  } = useSupabaseSignUp();

  const form = useForm<MigrationFormValues>({
    resolver: zodResolver(migrationSchema),
    defaultValues: {
      email: '',
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  function onValidate(values: { email: string; oldPassword: string }) {
    validateUser(
      { email: values.email, password: values.oldPassword },
      {
        onSuccess: (data) => {
          setUserInfo({ email: data.email, userId: data.userId });
          setStep('migrate');
        },
      }
    );
  }

  function onMigrate(values: MigrationFormValues) {
    if (!userInfo) return;

    signUp(
      {
        email: userInfo.email,
        password: values.newPassword,
        name: userInfo.email.split('@')[0], // Fallback name
      },
      {
        onSuccess: () => {
          setStep('success');
        },
      }
    );
  }

  function onSubmit(values: MigrationFormValues) {
    if (step === 'validate') {
      onValidate({ email: values.email, oldPassword: values.oldPassword });
    } else if (step === 'migrate') {
      onMigrate(values);
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Migration Successful!</CardTitle>
            <CardDescription>
              Your account has been successfully migrated to our new authentication
              system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✅ What&apos;s New:
              </h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Enhanced security</li>
                <li>• Password reset via email</li>
                <li>• Improved Google OAuth</li>
                <li>• Better session management</li>
              </ul>
            </div>

            <Link href="/dashboard">
              <Button className="w-full" variant="classical">
                Go to Dashboard
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === 'validate' ? 'Account Migration' : 'Set New Password'}
          </CardTitle>
          <CardDescription>
            {step === 'validate'
              ? 'Migrate your account to our new authentication system'
              : 'Create a new password for enhanced security'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {(validateError || migrateError) && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validateError?.message || migrateError?.message}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 'validate' && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            autoComplete="email"
                            disabled={isValidating}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isValidating}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 'migrate' && (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      ✅ Account verified: <strong>{userInfo?.email}</strong>
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isMigrating}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isMigrating}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                variant="classical"
                disabled={isValidating || isMigrating}
              >
                {isValidating && 'Validating...'}
                {isMigrating && 'Migrating Account...'}
                {!isValidating &&
                  !isMigrating &&
                  step === 'validate' &&
                  'Verify Account'}
                {!isValidating &&
                  !isMigrating &&
                  step === 'migrate' &&
                  'Complete Migration'}
                {!isValidating && !isMigrating && (
                  <ChevronRight className="w-4 h-4 ml-2" />
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-center text-sm text-muted-foreground">
              New user?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

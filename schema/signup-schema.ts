import { z } from 'zod';
import { VALIDATION_RULES, VALIDATION_MESSAGES } from '@/lib/constants/validation';

export const signupSchema = z
  .object({
    name: z.string()
      .min(VALIDATION_RULES.NAME_MIN_LENGTH, {
        message: VALIDATION_MESSAGES.NAME_TOO_SHORT,
      })
      .max(VALIDATION_RULES.NAME_MAX_LENGTH, {
        message: VALIDATION_MESSAGES.NAME_TOO_LONG,
      }),
    email: z.string().email({
      message: VALIDATION_MESSAGES.EMAIL_INVALID,
    }),
    password: z.string()
      .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, {
        message: VALIDATION_MESSAGES.PASSWORD_TOO_SHORT,
      })
      .max(VALIDATION_RULES.PASSWORD_MAX_LENGTH, {
        message: VALIDATION_MESSAGES.PASSWORD_TOO_LONG,
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH,
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

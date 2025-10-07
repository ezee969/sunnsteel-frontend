import { z } from 'zod';
import { VALIDATION_RULES, VALIDATION_MESSAGES } from '@/lib/constants/validation';

export const loginSchema = z.object({
  email: z.string().email({
    message: VALIDATION_MESSAGES.EMAIL_INVALID,
  }),
  password: z.string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, {
      message: VALIDATION_MESSAGES.PASSWORD_TOO_SHORT,
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

import { z } from 'zod';

// Auth validation
export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(3, 'Minimum 3 znaki')
    .max(100, 'Maximum 100 znakow'),
  password: z
    .string()
    .min(8, 'Haslo musi miec minimum 8 znakow')
    .max(100, 'Maximum 100 znakow'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .email('Nieprawidlowy adres email'),
  username: z
    .string()
    .min(3, 'Minimum 3 znaki')
    .max(30, 'Maximum 30 znakow')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tylko litery, cyfry i podkreslnik'),
  password: z
    .string()
    .min(8, 'Minimum 8 znakow')
    .regex(/[A-Z]/, 'Wymagana wielka litera')
    .regex(/[a-z]/, 'Wymagana mala litera')
    .regex(/[0-9]/, 'Wymagana cyfra'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasla musza byc identyczne',
  path: ['confirmPassword'],
});

// Quiz validation
export const quizSettingsSchema = z.object({
  mode: z.enum(['EN_TO_PL', 'PL_TO_EN']),
  category: z.string().nullable(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  wordLimit: z.number().int().min(1).max(500),
  timeLimit: z.number().int().min(0).max(3600),
  reinforceMode: z.boolean(),
});

export const translationAnswerSchema = z.object({
  wordId: z.string().min(1),
  userTranslation: z.string().min(1).max(200),
  mode: z.enum(['EN_TO_PL', 'PL_TO_EN']),
});

// Type inference
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type QuizSettingsInput = z.infer<typeof quizSettingsSchema>;
export type TranslationAnswerInput = z.infer<typeof translationAnswerSchema>;

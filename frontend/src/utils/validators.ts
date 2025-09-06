import { z } from 'zod';

// Common validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[\+]?[1-9][\d]{7,14}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .regex(emailPattern, 'Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(passwordPattern, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(phonePattern, 'Invalid phone number format. Use 8-15 digits with optional + prefix');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['customer', 'cook', 'delivery_agent'], {
    required_error: 'Please select a role',
  }),
  address: z.string().optional(),
  phone_no: phoneSchema.optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// Profile schemas
export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone_no: phoneSchema.optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  profile_image: z.any().optional(), // File upload
});

// Order schemas
export const orderItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  special_instructions: z.string().max(200, 'Special instructions must be less than 200 characters').optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  delivery_address: z.string().min(10, 'Delivery address must be at least 10 characters'),
  delivery_instructions: z.string().max(500, 'Delivery instructions must be less than 500 characters').optional(),
  payment_method: z.enum(['cash', 'card', 'online'], {
    required_error: 'Please select a payment method',
  }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ], {
    required_error: 'Please select a valid status',
  }),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Review schemas
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters'),
  order_id: z.string().min(1, 'Order ID is required'),
});

// Menu item schemas
export const menuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  image: z.any().optional(),
  is_available: z.boolean().default(true),
  preparation_time: z.number().min(1, 'Preparation time must be at least 1 minute').optional(),
});

// Utility functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateName = (name: string): boolean => {
  return nameSchema.safeParse(name).success;
};

// Error message helpers
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  return errors?.[fieldName]?.message;
};

export const hasFieldError = (errors: any, fieldName: string): boolean => {
  return !!errors?.[fieldName];
};


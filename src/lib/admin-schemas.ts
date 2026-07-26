import { z } from "zod";

export const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  page: z.number().int().min(1).max(500).optional().default(1),
  pageSize: z.number().int().min(5).max(100).optional().default(10),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const userUpdateSchema = z.object({
  userId: z.string().uuid(),
  full_name: z.string().trim().max(120).optional(),
  preferred_language: z.enum(["en", "ur", "ps"]).optional(),
});

export const userStatusSchema = z.object({
  userId: z.string().uuid(),
  suspend: z.boolean(),
});

export const userIdSchema = z.object({ userId: z.string().uuid() });

export const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "user"]),
});

export const articleSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().max(90).optional().or(z.literal("")),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  content: z.string().trim().max(50000).optional().or(z.literal("")),
  category: z.string().trim().min(1).max(60),
  language: z.enum(["en", "ur", "ps"]).default("en"),
  image_url: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean().default(false),
});

export const hospitalSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().max(160).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  maps_url: z.string().trim().max(500).optional().or(z.literal("")),
  emergency_24_7: z.boolean().default(false),
  opening_hours: z.string().trim().max(200).optional().or(z.literal("")),
  services: z.string().trim().max(400).optional().or(z.literal("")),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const messageReplySchema = z.object({
  id: z.string().uuid(),
  reply: z.string().trim().min(1).max(4000),
});

export const messageReadSchema = z.object({
  id: z.string().uuid(),
  read: z.boolean(),
});

export const uploadSchema = z.object({
  filename: z.string().trim().min(1).max(160),
  contentType: z.string().trim().min(3).max(120),
  dataBase64: z.string().min(10).max(9_000_000),
});
import { z } from 'zod';

export const MenuItemSchema = z.object({
  name: z.string(),
  price: z.string(),
  description: z.string().optional(),
});

export const BrandBriefSchema = z.object({
  business: z.object({
    name: z.string(),
    vendorType: z.enum(['home_caterer', 'food_truck', 'brick_and_mortar']),
    city: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    hours: z.string().optional(),
    stage: z.string().optional(),
  }),
  brand: z.object({
    primaryColor: z.string(),
    accentColor: z.string(),
    tagline: z.string(),
    voice: z.string(),
  }),
  menu: z.array(MenuItemSchema),
  media: z.object({
    logo: z.string().optional(),
    hero: z.string().optional(),
    gallery: z.array(z.string()).optional(),
  }),
  social: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      tiktok: z.string().optional(),
    })
    .optional(),
  reviews: z
    .array(
      z.object({
        text: z.string(),
        author: z.string(),
        rating: z.number().min(1).max(5),
      })
    )
    .optional(),
});

export type BrandBrief = z.infer<typeof BrandBriefSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;

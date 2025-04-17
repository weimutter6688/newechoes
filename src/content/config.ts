// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const tech = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        date: z.date(),
        summary: z.string().optional(),
        author: z.string().optional(),
        tags: z.array(z.string()).optional(),
        image: z.string().optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        technologies: z.array(z.string()).optional(),
        prerequisites: z.array(z.string()).optional(),
        draft: z.boolean().optional().default(false)
    })
});

// Export a single `collections` object to register your collection(s)
export const collections = {
    'tech': tech
};
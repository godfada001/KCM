import { z } from "zod";

const objectId = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  "Invalid ID"
);

const optionalText = (maxLength) =>
  z.string().trim().max(maxLength).nullable().optional();

const optionalUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .nullable()
  .optional();

const optionalDate = z
  .union([z.coerce.date(), z.null()])
  .optional();

const sermonFields = {
  title: z.string().trim().min(3).max(200),
  speaker: z.string().trim().min(2).max(120),
  description: optionalText(5000),
  scriptureReference: optionalText(200),
  preachedAt: optionalDate,
  videoUrl: optionalUrl,
  audioUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  status: z.enum(["draft", "published", "archived"]),
};

const announcementFields = {
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(3).max(10000),
  category: z.enum([
    "general",
    "service",
    "youth",
    "children",
    "prayer",
    "ministry",
    "other",
  ]),
  priority: z.enum(["normal", "important", "urgent"]),
  status: z.enum(["draft", "published", "archived"]),
  publishAt: optionalDate,
  expiresAt: optionalDate,
};

export const createSermonSchema = z.object({
  body: z.object({
    title: sermonFields.title,
    speaker: sermonFields.speaker,
    description: sermonFields.description,
    scriptureReference: sermonFields.scriptureReference,
    preachedAt: sermonFields.preachedAt,
    videoUrl: sermonFields.videoUrl,
    audioUrl: sermonFields.audioUrl,
    thumbnailUrl: sermonFields.thumbnailUrl,
    status: sermonFields.status.optional(),
  }).strict(),
});

export const updateSermonSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    title: sermonFields.title.optional(),
    speaker: sermonFields.speaker.optional(),
    description: sermonFields.description,
    scriptureReference: sermonFields.scriptureReference,
    preachedAt: sermonFields.preachedAt,
    videoUrl: sermonFields.videoUrl,
    audioUrl: sermonFields.audioUrl,
    thumbnailUrl: sermonFields.thumbnailUrl,
    status: sermonFields.status.optional(),
  }).strict().refine(
    (body) => Object.keys(body).length > 0,
    "Provide at least one field to update"
  ),
});

export const sermonIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export const sermonSlugSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1).max(250),
  }),
});

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: announcementFields.title,
    body: announcementFields.body,
    category: announcementFields.category.optional(),
    priority: announcementFields.priority.optional(),
    status: announcementFields.status.optional(),
    publishAt: announcementFields.publishAt,
    expiresAt: announcementFields.expiresAt,
  }).strict(),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: announcementFields.title.optional(),
    body: announcementFields.body.optional(),
    category: announcementFields.category.optional(),
    priority: announcementFields.priority.optional(),
    status: announcementFields.status.optional(),
    publishAt: announcementFields.publishAt,
    expiresAt: announcementFields.expiresAt,
  }).strict().refine(
    (body) => Object.keys(body).length > 0,
    "Provide at least one field to update"
  ),
});

export const announcementIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export const announcementSlugSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1).max(250),
  }),
});

export const contentListSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
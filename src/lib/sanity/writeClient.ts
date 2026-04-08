// src/lib/sanity/writeClient.ts — Sanity client with write permissions
// Uses a separate SANITY_WRITE_TOKEN to keep read/write concerns separate
import { createClient } from '@sanity/client';

export const writeClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'waxbya4l',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
  stega: { enabled: false },
});

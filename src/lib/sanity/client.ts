// src/lib/sanity/client.ts
import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'waxbya4l', // ← 你的 ID
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-10-01', // 固定一个日期字符串
  useCdn: true,             // 读线上内容建议 true
  stega: { enabled: false },
});

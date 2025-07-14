// src/lib/sanity.ts (调试专用简化版)

import { createClient } from '@sanity/client';

const projectId = "waxbya4l"; // 直接写死
const dataset = "production";   // 直接写死

// 确认环境变量是否被正确读取（可以保留这个检查）
if (!projectId || !dataset) {
  throw new Error("Project ID 或 Dataset 未能获取，请检查 .env 文件或此处的硬编码。");
}

export const sanityClient = createClient({
  projectId,
  dataset,
  useCdn: false, // 在调试期间，永远禁用 CDN
  apiVersion: '2023-07-01',
});
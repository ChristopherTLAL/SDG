// src/lib/queries.ts (最终修正版)

import { sanityClient } from './sanity.ts';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(sanityClient);

// Add the "export" keyword to this line
export function urlFor(source: any) {
  // The rest of the function remains the same
  if (!source || !source.asset) {
    return null;
  }
  return builder.image(source);
}

export type Post = {
  _id: string;
  title: string;
  slug: string;
  publishDate: string;
  coverImage?: { asset: { url: string } };
  excerpt?: string;
  category: string;
  audioFile?: { asset: { url: string } };
  sdgs?: string[];
  tags?: string[];
  body: any;
};

// 这个 postFields 我们只给 getPostBySlug 单独使用
const postFieldsForSingle = `
  _id,
  title,
  "slug": slug.current,
  publishDate,
  excerpt,
  category,
  coverImage,
  audioFile,
  sdgs,
  tags,
  body
`;

/**
 * 获取所有文章 (已修正)
 * 我们不再使用 postFields 模板，而是像其他函数一样明确写出查询，并添加 .map() 处理
 */
export async function getAllPosts(): Promise<Partial<Post>[]> {
  const query = `*[_type == "post" && defined(slug.current)] | order(publishDate desc) {
    _id,
    title,
    "slug": slug.current
  }`;
  const posts = await sanityClient.fetch<Post[]>(query);
  // 添加 .map() 确保数据被处理，即使这里只是原样返回
  return posts.map(post => ({
    ...post
  }));
}
 
/**
 * 根据分类获取文章
 */
export async function getPostsByCategory(category: string) {
  const query = `*[_type == "post" && category == $category] | order(publishDate desc) {
    title,
    "slug": slug.current, 
    excerpt,
    coverImage
  }`;
  const rawPosts = await sanityClient.fetch(query, { category });
  return rawPosts.map((post: Partial<Post>) => ({
    ...post,
    coverImageUrl: urlFor(post.coverImage)?.width(800).url() || '/default-cover.jpg'
  }));
}

/**
 * 根据 SDG 获取文章
 */
export async function getPostsBySdg(sdg: string) {
  const query = `*[_type == "post" && $sdg in sdgs] | order(publishDate desc) {
    title,
    "slug": slug.current,
    excerpt,
    coverImage
  }`;
  const rawPosts = await sanityClient.fetch(query, { sdg });
  return rawPosts.map((post: Partial<Post>) => ({
    ...post,
    coverImageUrl: urlFor(post.coverImage)?.width(800).url() || '/default-cover.jpg'
  }));
}

/**
 * 根据 Slug 获取单篇文章 (已修正)
 * 我们也给它加上 .map() 风格的处理，虽然只有一篇文章
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const query = `*[_type == "post" && slug.current == $slug][0]{ ${postFieldsForSingle} }`;
  const post = await sanityClient.fetch<Post | null>(query, { slug });
  // 如果没有文章，直接返回 null
  if (!post) {
    return null;
  }
  // 对单篇文章也进行处理，确保数据干净
  return {
    ...post,
    // 如果需要，也可以在这里添加 coverImageUrl
  };
}
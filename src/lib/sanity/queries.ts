// src/lib/sanity/queries.ts
import { client } from './client';

export const ALL_CATEGORIES_QUERY = /* groq */ `
  *[_type == "category"]{
    title,
    "slug": slug.current
  }
`;

export async function getAllCategories() {
  const data = await client.fetch(ALL_CATEGORIES_QUERY);
  return Array.isArray(data) ? data : [];
}

export async function getHomepageData() {
  const categories = await getAllCategories();

  const topStoriesQuery = /* groq */ `
    *[_type == "post" && defined(slug.current)] 
    | order(publishedAt desc)[0...5]{
      "slug": slug.current,
      title,
      excerpt,
      "category": category->title,
      mainImage{
        asset->{url, metadata{lqip}}
      }
    }
  `;

  const categoryPostsQueries = categories.map(category => {
    return `"${category.slug}": *[_type == "post" && category->slug.current == "${category.slug}"] | order(publishedAt desc)[0...4]{
      "slug": slug.current,
      title,
      excerpt,
      "category": category->title,
      mainImage{
        asset->{url, metadata{lqip}}
      }
    }`;
  }).join(',\n');

  const query = `{
    "topStories": ${topStoriesQuery},
    "categoryPosts": {
      ${categoryPostsQueries}
    }
  }`;

  const data = await client.fetch(query);
  
  return {
    ...data,
    categories,
  };
}

export const POST_BY_SLUG_QUERY = /* groq */ `
    *[_type == "post" && slug.current == $slug][0]{
      "slug": slug.current,
      title,
      excerpt,
      body,
      "category": category->title,
      publishedAt,
      mainImage{
        asset->{url, metadata{lqip}}
      },
      author->{
        name,
        "avatar": image.asset->url
      }
    }
  `;

// 详情：通过 slug 取一篇
export async function getPostBySlug(slug: string) {
  return client.fetch(POST_BY_SLUG_QUERY, { slug });
}

export const ALL_POST_SLUGS_QUERY = /* groq */ `
    *[_type == "post" && defined(slug.current)][]{
      "slug": slug.current
    }
  `;

// 生成静态路径需要的 slug 列表
export async function getAllPostSlugs() {
  const list = await client.fetch(ALL_POST_SLUGS_QUERY);
  return (Array.isArray(list) ? list : []).map((p: any) => p.slug);
}

// （可选）按分类取列表
export async function getCategoryPosts(categorySlug: string) {
  const query = /* groq */ `
    *[_type == "post" && category->slug.current == $categorySlug] 
      | order(publishedAt desc){
        "slug": slug.current,
        title,
        excerpt,
        "category": category->title
      }
  `;
  return client.fetch(query, { categorySlug });
}

// Add the new function here
export async function getPostsBySdg(sdgId: string) {
  const query = /* groq */ `
    *[_type == "post" && sdg._ref == $sdgId] 
      | order(publishedAt desc){
        "slug": slug.current,
        title,
        excerpt,
        "category": category->title
      }
  `;
  return client.fetch(query, { sdgId });
}

// src/lib/sanity/queries.ts
import { client } from './client';

// ── Posts (News & Research) ──────────────────────────────────

export async function getLatestPosts(lang: string = 'en', limit: number = 4) {
  const query = /* groq */ `
    *[_type == "post" && defined(slug.current)]
    | order(publishedAt desc)[0...$limit]{
      "slug": slug.current,
      "title": title,
      contentType,
      sdgTags,
      mainImage,
      "excerpt": excerpt,
      publishedAt,
      readingTime
    }
  `;
  const data = await client.fetch(query, { limit });
  return Array.isArray(data) ? data : [];
}

export async function getTrendingPosts(lang: string = 'en', limit: number = 4) {
  // Prefer editorially featured posts; fall back to latest if none are featured
  const query = /* groq */ `
    *[_type == "post" && defined(slug.current) && featured == true]
    | order(publishedAt desc)[0...$limit]{
      "slug": slug.current,
      "title": title,
      contentType
    }
  `;
  const data = await client.fetch(query, { limit });
  if (Array.isArray(data) && data.length > 0) return data;
  // Fallback: latest posts
  const fallback = /* groq */ `
    *[_type == "post" && defined(slug.current)]
    | order(publishedAt desc)[0...$limit]{
      "slug": slug.current,
      "title": title,
      contentType
    }
  `;
  const fb = await client.fetch(fallback, { limit });
  return Array.isArray(fb) ? fb : [];
}

export async function getResearchPosts(lang: string = 'en', contentType?: string, limit: number = 20) {
  const filter = contentType
    ? `*[_type == "post" && defined(slug.current) && contentType == $contentType]`
    : `*[_type == "post" && defined(slug.current)]`;
  const query = /* groq */ `
    ${filter} | order(publishedAt desc)[0...$limit]{
      "slug": slug.current,
      "title": title,
      contentType,
      sdgTags,
      mainImage,
      "excerpt": excerpt,
      publishedAt,
      readingTime,
      author->{ name, image }
    }
  `;
  const data = await client.fetch(query, { contentType: contentType || '', limit });
  return Array.isArray(data) ? data : [];
}

export async function getPostBySlug(slug: string) {
  const query = /* groq */ `
    *[_type == "post" && slug.current == $slug][0]{
      "slug": slug.current,
      "title": title,
      "excerpt": excerpt,
      "body": body,
      contentType,
      sdgTags,
      publishedAt,
      readingTime,
      mainImage{
        asset->{url, metadata{lqip}}
      },
      author->{
        name,
        "avatar": image.asset->url,
        bio
      }
    }
  `;
  return client.fetch(query, { slug });
}

export async function getAllPostSlugs() {
  const query = /* groq */ `
    *[_type == "post" && defined(slug.current)]{
      "slug": slug.current
    }
  `;
  const list = await client.fetch(query);
  return (Array.isArray(list) ? list : []).map((p: any) => p.slug);
}

// ── Projects ─────────────────────────────────────────────────

export async function getProjects(lang: string = 'en') {
  const query = /* groq */ `
    *[_type == "project" && defined(slug.current)]
    | order(applicationDeadline desc){
      "slug": slug.current,
      "title": title,
      projectType,
      status,
      applicationDeadline,
      "description": description,
      mainImage,
      team,
      sdgTags,
      icon
    }
  `;
  const data = await client.fetch(query);
  return Array.isArray(data) ? data : [];
}

export async function getProjectBySlug(slug: string) {
  const query = /* groq */ `
    *[_type == "project" && slug.current == $slug][0]{
      "slug": slug.current,
      "title": title,
      projectType,
      status,
      applicationDeadline,
      "description": description,
      "body": body,
      mainImage{
        asset->{url, metadata{lqip}}
      },
      team,
      sdgTags,
      icon
    }
  `;
  return client.fetch(query, { slug });
}

export async function getAllProjectSlugs() {
  const query = /* groq */ `
    *[_type == "project" && defined(slug.current)]{
      "slug": slug.current
    }
  `;
  const list = await client.fetch(query);
  return (Array.isArray(list) ? list : []).map((p: any) => p.slug);
}

// ── Dialogues (Events) ───────────────────────────────────────

export async function getDialogues(lang: string = 'en') {
  const query = /* groq */ `
    *[_type == "dialogue" && defined(slug.current)]
    | order(date desc){
      "slug": slug.current,
      "title": title,
      eventType,
      date,
      endDate,
      "location": location,
      "description": description,
      featured,
      sdgTags
    }
  `;
  const data = await client.fetch(query);
  return Array.isArray(data) ? data : [];
}

export async function getUpcomingDialogues(lang: string = 'en', limit: number = 3) {
  const now = new Date().toISOString();
  const query = /* groq */ `
    *[_type == "dialogue" && defined(slug.current) && date >= $now]
    | order(date asc)[0...$limit]{
      "slug": slug.current,
      "title": title,
      eventType,
      date,
      "location": location,
      featured
    }
  `;
  const data = await client.fetch(query, { now, limit });
  return Array.isArray(data) ? data : [];
}

// ── Homepage Aggregate ───────────────────────────────────────

export async function getHomepageData(lang: string = 'en') {
  const now = new Date().toISOString();
  const query = /* groq */ `{
    "latestPosts": *[_type == "post" && defined(slug.current)]
      | order(publishedAt desc)[0...4]{
        "slug": slug.current,
        "title": title,
        contentType,
        sdgTags,
        mainImage,
        "excerpt": excerpt,
        publishedAt,
        readingTime
      },
    "trendingPosts": *[_type == "post" && defined(slug.current) && featured == true]
      | order(publishedAt desc)[0...4]{
        "slug": slug.current,
        "title": title,
        contentType
      },
    "projects": *[_type == "project" && defined(slug.current)]
      | order(_createdAt desc)[0...3]{
        "slug": slug.current,
        "title": title,
        status,
        "description": description,
        icon,
        team,
        sdgTags
      },
    "upcomingDialogues": *[_type == "dialogue" && defined(slug.current) && date >= $now]
      | order(date asc)[0...2]{
        "slug": slug.current,
        "title": title,
        date,
        eventType
      }
  }`;
  return client.fetch(query, { now });
}

// ── Search ───────────────────────────────────────────────────

export async function searchPosts(term: string, lang: string = 'en') {
  const query = /* groq */ `
    *[_type == "post" && (title.en match $term || title.zh match $term || pt::text(body.en) match $term || pt::text(body.zh) match $term)]
    | score(title.en match $term, title.zh match $term)
    | order(_score desc) {
      "slug": slug.current,
      "title": title,
      "excerpt": excerpt,
      contentType,
      publishedAt
    }
  `;
  return client.fetch(query, { term });
}

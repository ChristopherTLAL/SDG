// sanity/schemas/post.ts
import {defineField, defineType, Rule} from 'sanity'

async function isUniqueHomepageFeature(isHomepageFeature: boolean, context: any) {
  if (!isHomepageFeature) {
    return true
  }

  const {getClient} = context
  const client = getClient({apiVersion: '2022-12-07'})
  const id = context.document._id.replace('drafts.', '')
  const params = {
    draft: `drafts.${id}`,
    published: id,
  }
  const query = `*[_type == 'post' && isHomepageFeature == true && !(_id in [$draft, $published])]`
  const result = await client.fetch(query, params)

  return result.length === 0 ? true : '只能有一篇文章被设置为首页主推。请先取消其他文章的主推设置。'
}

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isHomepageFeature',
      title: '设置为首页主推文章 (Homepage Feature)',
      type: 'boolean',
      description: '勾选此项，这篇文章将作为首页顶部的大图文章展示。请确保只有一个文章被勾选。',
      initialValue: false,
      validation: (Rule: Rule) => Rule.custom(isUniqueHomepageFeature),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          description: '为图片提供描述性文字，对SEO和可访问性很重要。'
        }
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: {type: 'category'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'excerpt',
        title: 'Excerpt',
        description: '文章的简短摘要，会显示在列表页。',
        type: 'text',
        rows: 3,
        validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent', // 注意这里引用了我们上面定义的 blockContent
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    },
  },
})
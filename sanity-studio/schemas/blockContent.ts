// sanity/schemas/blockContent.ts
import {defineType, defineArrayMember} from 'sanity'

export default defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      // 这里定义了段落样式，比如 H1, H2, H3, blockquote
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      // 定义列表样式
      lists: [{title: 'Bullet', value: 'bullet'}],
      // 定义文本标记，比如 bold, italic
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
        ],
        // 定义链接
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    // 你可以在这里允许在正文中插入图片
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
    }),
  ],
})
// schemas/post.ts - 正确的代码

import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: '文章',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: '链接后缀 (英文或拼音)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishDate',
      title: '发布日期',
      type: 'date',
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: '封面图片',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'excerpt',
      title: '摘要 (用于在列表页显示)',
      type: 'text',
      rows: 3,
    }),
    defineField({
        name: 'category',
        title: '核心分类',
        type: 'string', // 直接定义为字符串
        options: {
          list: [ // 创建一个下拉/单选列表
            {title: '未来播客', value: 'podcast'},
            {title: '人物专访', value: 'interview'},
            {title: '研究报告', value: 'report'},
            {title: '活动与研讨', value: 'event'},
          ],
          layout: 'radio',
        },
        validation: (Rule) => Rule.required(),
    }),

    defineField({
        name: 'audioFile', // 名字改成 audioFile 更贴切
        title: '播客音频文件',
        type: 'file', // <--- 类型改成“文件”
        options: {
          accept: 'audio/mp3', // 限制只能上传 mp3 文件，防止传错
        },
        hidden: ({document}) => document?.category !== 'podcast',
    }),
    defineField({
        name: 'sdgs',
        title: '关联的 SDG 目标',
        type: 'array',
        of: [{type: 'string'}],
        options: {
          list: [
            {title: 'SDG 1: 无贫穷', value: '1'},
            {title: 'SDG 2: 零饥饿', value: '2'},
            {title: 'SDG 3: 良好健康与福祉', value: '3'},
            {title: 'SDG 4: 优质教育', value: '4'},
            {title: 'SDG 5: 性别平等', value: '5'},
            {title: 'SDG 6: 清洁饮水和卫生设施', value: '6'},
            {title: 'SDG 7: 经济适用的清洁能源', value: '7'},
            {title: 'SDG 8: 体面工作和经济增长', value: '8'},
            {title: 'SDG 9: 产业、创新和基础设施', value: '9'},
            {title: 'SDG 10: 减少不平等', value: '10'},
            {title: 'SDG 11: 可持续城市和社区', value: '11'},
            {title: 'SDG 12: 负责任消费和生产', value: '12'},
            {title: 'SDG 13: 气候行动', value: '13'},
            {title: 'SDG 14: 水下生物', value: '14'},
            {title: 'SDG 15: 陆地生物', value: '15'},
            {title: 'SDG 16: 和平、正义与强大机构', value: '16'},
            {title: 'SDG 17: 促进目标实现的伙伴关系', value: '17'},
          ]
        }
    }),
    defineField({
        name: 'tags',
        title: '自定义标签',
        type: 'array',
        of: [{type: 'string'}],
        options: {
          layout: 'tags',
        },
    }),
    defineField({
      name: 'body',
      title: '正文内容',
      type: 'blockContent',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
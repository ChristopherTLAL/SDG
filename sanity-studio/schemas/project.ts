// sanity-studio/schemas/project.ts
import {defineField, defineType} from 'sanity'

const sdgOptions = Array.from({length: 17}, (_, i) => ({
  title: `SDG ${i + 1}`,
  value: `sdg-${i + 1}`,
}))

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title.en',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Recruiting', value: 'recruiting'},
          {title: 'Ongoing', value: 'ongoing'},
          {title: 'Completed', value: 'completed'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'localizedBlockContent',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
    }),
    defineField({
      name: 'team',
      title: 'Team',
      type: 'string',
    }),
    defineField({
      name: 'sdgTags',
      title: 'SDG Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: sdgOptions,
      },
    }),
    defineField({
      name: 'icon',
      title: 'Icon (Material Symbol name)',
      type: 'string',
      description: 'e.g. "eco", "water_drop", "school", "park"',
    }),
  ],
  preview: {
    select: {
      title: 'title.en',
      subtitle: 'status',
      media: 'mainImage',
    },
  },
})

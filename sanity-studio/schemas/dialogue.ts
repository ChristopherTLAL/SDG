// sanity-studio/schemas/dialogue.ts
import {defineField, defineType} from 'sanity'

const sdgOptions = Array.from({length: 17}, (_, i) => ({
  title: `SDG ${i + 1}`,
  value: `sdg-${i + 1}`,
}))

export default defineType({
  name: 'dialogue',
  title: 'Dialogue',
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
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          {title: 'Assembly', value: 'assembly'},
          {title: 'Panel', value: 'panel'},
          {title: 'Workshop', value: 'workshop'},
          {title: 'Forum', value: 'forum'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Start Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'localizedString',
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
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
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
  ],
  preview: {
    select: {
      title: 'title.en',
      subtitle: 'eventType',
    },
  },
})

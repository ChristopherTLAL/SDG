// sanity-studio/schemas/mdpaResult.ts — MDPA personality test results
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'mdpaResult',
  title: 'MDPA Result',
  type: 'document',
  fields: [
    defineField({
      name: 'resultId',
      title: 'Result ID',
      type: 'string',
      description: 'Public-facing unique ID for the result URL',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'studentName',
      title: 'Student Name',
      type: 'string',
    }),
    defineField({
      name: 'studentEmail',
      title: 'Student Email',
      type: 'string',
    }),
    defineField({
      name: 'studentBackground',
      title: 'Student Background',
      type: 'text',
      description: 'Current major, target program, goals, etc.',
    }),
    defineField({
      name: 'mbtiType',
      title: 'MBTI Type',
      type: 'string',
      description: 'e.g. INFP, ENTJ',
    }),
    defineField({
      name: 'mbtiStrength',
      title: 'MBTI Strength',
      type: 'object',
      fields: [
        { name: 'EI', type: 'number', title: 'E-I' },
        { name: 'NS', type: 'number', title: 'N-S' },
        { name: 'FT', type: 'number', title: 'F-T' },
        { name: 'JP', type: 'number', title: 'J-P' },
      ],
    }),
    defineField({
      name: 'ocean',
      title: 'OCEAN Scores (lambda calibrated)',
      type: 'object',
      fields: [
        { name: 'O', type: 'number', title: 'Openness' },
        { name: 'C', type: 'number', title: 'Conscientiousness' },
        { name: 'E', type: 'number', title: 'Extraversion' },
        { name: 'A', type: 'number', title: 'Agreeableness' },
        { name: 'N', type: 'number', title: 'Neuroticism' },
      ],
    }),
    defineField({
      name: 'oceanRaw',
      title: 'OCEAN Raw (before AV calibration)',
      type: 'object',
      fields: [
        { name: 'O', type: 'number', title: 'Openness' },
        { name: 'C', type: 'number', title: 'Conscientiousness' },
        { name: 'E', type: 'number', title: 'Extraversion' },
        { name: 'A', type: 'number', title: 'Agreeableness' },
      ],
    }),
    defineField({
      name: 'nClusters',
      title: 'Neuroticism Clusters',
      type: 'object',
      fields: [
        { name: 'ar', type: 'number', title: 'Analytical Rumination' },
        { name: 'sv', type: 'number', title: 'Stress Vulnerability' },
        { name: 'er', type: 'number', title: 'Emotional Reactivity' },
      ],
    }),
    defineField({
      name: 'avAdjustments',
      title: 'AV Calibration Adjustments',
      type: 'object',
      fields: [
        { name: 'E', type: 'number', title: 'E adj' },
        { name: 'O', type: 'number', title: 'O adj' },
        { name: 'C', type: 'number', title: 'C adj' },
        { name: 'A', type: 'number', title: 'A adj' },
        { name: 'N', type: 'number', title: 'N adj' },
      ],
    }),
    defineField({
      name: 'qualityChecks',
      title: 'Quality Check Flags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'rawResponses',
      title: 'Raw Responses (full JSON)',
      type: 'text',
      description: 'Stringified JSON of all individual responses for reanalysis',
    }),
    defineField({
      name: 'totalQuestions',
      title: 'Total Questions Answered',
      type: 'number',
    }),
    defineField({
      name: 'durationSeconds',
      title: 'Duration (seconds)',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      studentName: 'studentName',
      mbtiType: 'mbtiType',
      completedAt: 'completedAt',
      resultId: 'resultId',
    },
    prepare({ studentName, mbtiType, completedAt, resultId }) {
      return {
        title: `${studentName || 'Anonymous'} — ${mbtiType || '?'}`,
        subtitle: `${completedAt ? new Date(completedAt).toLocaleDateString() : ''} · ${resultId?.slice(0, 8) || ''}`,
      }
    },
  },
})

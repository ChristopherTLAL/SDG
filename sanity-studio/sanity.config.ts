import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
// 重点：从 './schemas' (它会自动寻找 index.ts) 导入 schemaTypes
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: 'Scholarly AC CN', // 在这里改成你的项目名称

  projectId: 'waxbya4l', // 替换成你的 Project ID
  dataset: 'production', // 或者 'development'

  plugins: [structureTool(), visionTool()],

  schema: {
    // 重点：在这里使用导入的 schemaTypes
    types: schemaTypes,
  },
})
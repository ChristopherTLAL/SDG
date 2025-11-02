// sanity/schemas/index.ts
import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'

// 将所有 schema 导入并放在一个数组中导出
export const schemaTypes = [post, author, category, blockContent]
// sanity-studio/schemas/index.ts
import blockContent from './blockContent'
import post from './post'
import author from './author'
import project from './project'
import dialogue from './dialogue'
import {localizedString, localizedText, localizedBlockContent} from './localeFields'

export const schemaTypes = [
  // Locale field types
  localizedString,
  localizedText,
  localizedBlockContent,
  // Document types
  post,
  author,
  project,
  dialogue,
  // Other types
  blockContent,
]

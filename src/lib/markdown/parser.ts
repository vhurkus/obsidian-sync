/**
 * Markdown utility functions for Monaco Editor
 * PRD requirement: Markdown syntax support
 */

export interface MarkdownFormatter {
  bold: (text: string) => string
  italic: (text: string) => string
  link: (text: string, url?: string) => string
  code: (text: string) => string
  codeBlock: (text: string, language?: string) => string
  header: (text: string, level: number) => string
  list: (items: string[], ordered?: boolean) => string
  quote: (text: string) => string
}

export const markdownFormatter: MarkdownFormatter = {
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `*${text}*`,
  link: (text: string, url: string = 'url') => `[${text}](${url})`,
  code: (text: string) => `\`${text}\``,
  codeBlock: (text: string, language: string = '') => 
    `\`\`\`${language}\n${text}\n\`\`\``,
  header: (text: string, level: number) => 
    `${'#'.repeat(Math.max(1, Math.min(6, level)))} ${text}`,
  list: (items: string[], ordered: boolean = false) => 
    items.map((item, i) => 
      ordered ? `${i + 1}. ${item}` : `- ${item}`
    ).join('\n'),
  quote: (text: string) => `> ${text}`
}

/**
 * Extract markdown syntax patterns for highlighting
 */
export const markdownPatterns = {
  header: /^#{1,6}\s.*/gm,
  bold: /\*\*.*?\*\*/g,
  italic: /\*.*?\*/g,
  code: /`.*?`/g,
  codeBlock: /```[\s\S]*?```/g,
  link: /\[.*?\]\(.*?\)/g,
  quote: /^>\s.*/gm,
  list: /^[\s]*[-*+]\s/gm,
  orderedList: /^[\s]*\d+\.\s/gm,
}

/**
 * Generate markdown table of contents
 */
export function generateTOC(content: string): string {
  const headers = content.match(markdownPatterns.header) || []
  
  return headers
    .map(header => {
      const level = header.match(/^#{1,6}/)?.[0].length || 1
      const text = header.replace(/^#{1,6}\s/, '')
      const anchor = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')
      const indent = '  '.repeat(level - 1)
      
      return `${indent}- [${text}](#${anchor})`
    })
    .join('\n')
}

/**
 * Count words in markdown content (excluding syntax)
 */
export function countWords(content: string): number {
  const cleaned = content
    .replace(markdownPatterns.codeBlock, '')
    .replace(markdownPatterns.code, '')
    .replace(markdownPatterns.link, '$1')
    .replace(/[#*>`\-\d\.]/g, '')
    .trim()
  
  return cleaned ? cleaned.split(/\s+/).length : 0
}

/**
 * Estimate reading time (average 200 words per minute)
 */
export function estimateReadingTime(content: string): string {
  const words = countWords(content)
  const minutes = Math.ceil(words / 200)
  
  if (minutes < 1) return 'Az önce okunur'
  if (minutes === 1) return '1 dakika okuma'
  return `${minutes} dakika okuma`
}

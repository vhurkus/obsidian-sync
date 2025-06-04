'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { NoteWithTags } from '@/types'
import 'highlight.js/styles/github-dark.css'

interface MarkdownPreviewProps {
  note: NoteWithTags | null
  content?: string
  className?: string
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  note,
  content,
  className = ''
}) => {
  const [markdownContent, setMarkdownContent] = useState('')

  useEffect(() => {
    setMarkdownContent(content || note?.content || '')
  }, [content, note])

  if (!markdownContent.trim()) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg mb-2">Önizleme için bir şeyler yazın</p>
          <p className="text-sm">Markdown syntax&apos;ı desteklenir</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full overflow-auto bg-[#0F1419] ${className}`}>      <div className="max-w-none p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Headings
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-white mb-6 pb-3 border-b border-gray-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-white mb-4 mt-8 pb-2 border-b border-gray-800">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold text-white mb-3 mt-6">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-semibold text-white mb-2 mt-4">
                {children}
              </h4>
            ),
            h5: ({ children }) => (
              <h5 className="text-base font-semibold text-white mb-2 mt-4">
                {children}
              </h5>
            ),
            h6: ({ children }) => (
              <h6 className="text-sm font-semibold text-gray-300 mb-2 mt-4">
                {children}
              </h6>
            ),

            // Paragraphs
            p: ({ children }) => (
              <p className="text-gray-300 mb-4 leading-relaxed">
                {children}
              </p>
            ),

            // Links
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                {children}
              </a>
            ),

            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 text-gray-300 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-300 leading-relaxed">
                {children}
              </li>
            ),

            // Text formatting
            strong: ({ children }) => (
              <strong className="font-bold text-white">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-100">
                {children}
              </em>
            ),            // Code
            code: ({ children, className, ...props }) => {
              const isInline = !className || !className.includes('language-')
              if (isInline) {
                return (
                  <code className="bg-gray-800 text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                )              }
              return (
                <code className={`${className} block`} {...props}>
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 overflow-x-auto">
                {children}
              </pre>
            ),

            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-gray-800/30 text-gray-300 italic">
                {children}
              </blockquote>
            ),

            // Tables
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-800">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-gray-700">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-gray-800/50 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-3 text-left text-white font-semibold border-r border-gray-700 last:border-r-0">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 text-gray-300 border-r border-gray-700 last:border-r-0">
                {children}
              </td>
            ),

            // Horizontal rule
            hr: () => (
              <hr className="border-gray-700 my-8" />
            ),

            // Images
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded-lg shadow-lg mb-4"
              />
            ),

            // Task lists (GitHub Flavored Markdown)
            input: ({ type, checked }) => {
              if (type === 'checkbox') {
                return (
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="mr-2 accent-blue-500"
                  />
                )
              }
              return null
            },
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>

      {/* Custom CSS for additional styling */}
      <style jsx global>{`
        .markdown-preview {
          color: #e2e8f0;
          line-height: 1.7;
        }

        .markdown-preview pre code {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .markdown-preview code[class*="language-"] {
          background: transparent !important;
          text-shadow: none !important;
        }

        .markdown-preview .hljs {
          background: #1a1a1a !important;
          color: #e2e8f0 !important;
        }

        /* Task list styling */
        .markdown-preview li:has(input[type="checkbox"]) {
          list-style: none;
          margin-left: -1.5rem;
        }

        .markdown-preview li input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        /* Better spacing for nested lists */
        .markdown-preview ul ul,
        .markdown-preview ol ol,
        .markdown-preview ul ol,
        .markdown-preview ol ul {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          margin-left: 1.5rem;
        }

        /* Code block language indicator */
        .markdown-preview pre {
          position: relative;
        }

        .markdown-preview pre code[class*="language-"]::before {
          content: attr(class);
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
          background: #374151;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  )
}

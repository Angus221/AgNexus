/**
 * AG.NEXUS - Markdown 渲染组件
 * 支持 GitHub Flavored Markdown + 代码高亮
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    // 代码块处理
    code({ className, children, ...props }: any) {
      const inline = !className
      return !inline ? (
        <code className={className} {...props}>
          {children}
        </code>
      ) : (
        <code
          className="bg-default-100 px-1.5 py-0.5 rounded text-sm font-mono text-default-700"
          {...props}
        >
          {children}
        </code>
      )
    },
    // 链接处理
    a({ children, ...props }) {
      return (
        <a
          className="text-primary hover:underline cursor-pointer"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    },
    // 引用块处理
    blockquote({ children, ...props }) {
      return (
        <blockquote
          className="border-l-4 border-default-300 pl-4 my-2 text-default-600 italic"
          {...props}
        >
          {children}
        </blockquote>
      )
    },
    // 表格处理
    table({ children, ...props }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-default-200" {...props}>
            {children}
          </table>
        </div>
      )
    },
    th({ children, ...props }) {
      return (
        <th
          className="border border-default-200 px-4 py-2 bg-default-100 font-semibold text-left"
          {...props}
        >
          {children}
        </th>
      )
    },
    td({ children, ...props }) {
      return (
        <td className="border border-default-200 px-4 py-2" {...props}>
          {children}
        </td>
      )
    },
    // 列表处理
    ul({ children, ...props }) {
      return (
        <ul className="list-disc list-inside my-2 space-y-1" {...props}>
          {children}
        </ul>
      )
    },
    ol({ children, ...props }) {
      return (
        <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
          {children}
        </ol>
      )
    },
    // 标题处理
    h1({ children, ...props }) {
      return (
        <h1 className="text-2xl font-bold mt-4 mb-2" {...props}>
          {children}
        </h1>
      )
    },
    h2({ children, ...props }) {
      return (
        <h2 className="text-xl font-bold mt-3 mb-2" {...props}>
          {children}
        </h2>
      )
    },
    h3({ children, ...props }) {
      return (
        <h3 className="text-lg font-semibold mt-2 mb-1" {...props}>
          {children}
        </h3>
      )
    },
    // 段落处理
    p({ children, ...props }) {
      return (
        <p className="my-2 leading-relaxed" {...props}>
          {children}
        </p>
      )
    },
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

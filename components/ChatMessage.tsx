'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { EnhancedChatMessage } from '@/hooks/useChatSession';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: EnhancedChatMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const detectLanguage = (className: string | undefined): string => {
    if (!className) return 'text';
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : 'text';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {isUser ? (
        <div className="flex gap-3 max-w-[85%]">
          <div className="flex flex-col items-end gap-1.5">
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--surface-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl rounded-tr-sm px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed shadow-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent-warm-soft)] to-transparent opacity-0 animate-shimmer pointer-events-none" />
              {message.content}
            </motion.div>
          </div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent-warm)] to-[var(--accent-warm-soft)] flex items-center justify-center shadow-md"
          >
            <User className="w-4 h-4 text-[var(--bg-primary)]" />
          </motion.div>
        </div>
      ) : (
        <div className="flex gap-3 max-w-[85%]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--surface-primary)] border border-[var(--border-subtle)] flex items-center justify-center shadow-sm"
          >
            <Bot className="w-4 h-4 text-[var(--text-secondary)]" />
          </motion.div>
          <div className="flex flex-col gap-1.5 w-full min-w-0">
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed overflow-hidden relative"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-lg font-semibold text-[var(--text-primary)] mt-4 mb-2 first:mt-0 pb-1 border-b border-[var(--border-subtle)]">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold text-[var(--text-primary)] mt-4 mb-2 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-3 mb-1 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-[var(--text-secondary)] mb-3 last:mb-0 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-none mb-3 space-y-1.5 text-[var(--text-secondary)] pl-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-3 space-y-1 text-[var(--text-secondary)]">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-[var(--text-secondary)] leading-relaxed relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warm)]">
                      {children}
                    </li>
                  ),
                  code: ({ children, className, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;

                    if (isInline) {
                      return (
                        <code className="bg-[var(--surface-secondary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded-md text-xs font-mono border border-[var(--border-subtle)]" {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="relative my-3 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                        <div className="absolute top-0 left-0 right-0 h-8 bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)] flex items-center px-3">
                          <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                            {detectLanguage(className)}
                          </span>
                        </div>
                        <SyntaxHighlighter
                          // @ts-expect-error - react-syntax-highlighter types are incorrect
                          style={oneDark}
                          language={detectLanguage(className)}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: '2.5rem 1rem 1rem',
                            background: 'var(--surface-primary)',
                            fontSize: '0.75rem',
                            lineHeight: '1.6',
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        <button
                          onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                          className="absolute top-1.5 right-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--surface-secondary)]"
                          title="Copy code"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    );
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-[var(--border-subtle)]">
                      <table className="w-full text-sm border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-[var(--surface-secondary)]">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="text-left text-[var(--text-primary)] font-semibold px-4 py-2.5 border-b border-[var(--border-subtle)]">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="text-[var(--text-secondary)] px-4 py-2.5 border-b border-[var(--border-subtle)]">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-[var(--accent-warm)] pl-4 my-3 italic text-[var(--text-tertiary)] bg-[var(--surface-secondary)] rounded-r-lg py-2">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-[var(--text-primary)] font-semibold">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-[var(--text-secondary)]">
                      {children}
                    </em>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-[var(--accent-warm)] underline underline-offset-2 hover:no-underline transition-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  hr: () => (
                    <hr className="border-[var(--border-subtle)] my-4" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <motion.span
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scaleY: [1, 1.2, 1]
                  }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-block w-2 h-4 bg-gradient-to-b from-[var(--accent-warm)] to-[var(--accent-warm-soft)] ml-1 rounded-sm align-middle shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                />
              )}
            </motion.div>
            {message.intentTag && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-secondary)] text-[var(--text-tertiary)] rounded-full text-[10px] uppercase tracking-wider font-medium w-fit"
              >
                {message.intentTag}
              </motion.span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

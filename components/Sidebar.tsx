'use client';

import React, { useState } from 'react';
import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Plus, Trash2, Menu, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SessionWithTitle } from '@/hooks/useSessionTitles';
import { ProfileNavItem } from '@/components/ProfileNavItem';

interface SessionListProps {
  sessions: SessionWithTitle[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

function SessionList({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: SessionListProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--surface-primary)] border border-[var(--border-subtle)] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          Start your first conversation
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-0.5">
      <AnimatePresence mode="popLayout">
        {sessions.map((session, index) => (
          <motion.button
            key={session.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
              currentSessionId === session.id
                ? 'bg-gradient-to-r from-[var(--surface-secondary)] to-[var(--surface-primary)] border border-[var(--border-default)]'
                : 'hover:bg-[var(--surface-primary)] border border-transparent'
            }`}
          >
            {currentSessionId === session.id && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-[var(--accent-warm)] to-[var(--accent-warm-soft)] rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <div className="flex items-start justify-between gap-2 pl-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                  <p className={`text-sm truncate font-medium ${
                    currentSessionId === session.id
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  }`}>
                    {session.displayTitle}
                  </p>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1 ml-5 flex items-center gap-1.5">
                  <span>{session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}</span>
                  <span className="opacity-40">•</span>
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              {onDeleteSession && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="text-[var(--text-tertiary)] hover:text-[var(--error)] transition-all p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--error-soft)] rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface SidebarProps {
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  sessions: SessionWithTitle[];
  isLoading: boolean;
  error: string | null;
  onDeleteSession?: (id: string) => void;
}

export function Sidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  sessions,
  isLoading,
  error,
  onDeleteSession
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-3 left-3 z-50 text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] h-9 w-9 rounded-xl shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-4 h-4" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:w-80 p-0 bg-[var(--bg-primary)] border-r border-[var(--border-subtle)]">
          <SheetHeader className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <SheetTitle className="text-[var(--text-primary)] text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-warm)]" />
              Conversations
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-60px)]">
            <div className="p-3 border-b border-[var(--border-subtle)]">
              <Button
                variant="outline"
                className="w-full border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-default)] bg-[var(--surface-primary)] rounded-xl h-10 text-sm font-medium group"
                onClick={() => {
                  onNewChat();
                  setIsOpen(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                New Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <h3 className="text-[10px] font-semibold text-[var(--text-tertiary)] mb-2 px-2 uppercase tracking-wider">
                Recent
              </h3>

              {isLoading ? (
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[var(--surface-primary)] animate-pulse">
                      <Skeleton className="h-4 w-3/4 bg-[var(--surface-secondary)]" />
                      <Skeleton className="h-3 w-1/3 mt-2 bg-[var(--surface-secondary)]" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-6 text-xs text-[var(--text-tertiary)] bg-[var(--error-soft)] rounded-xl">
                  {error}
                </div>
              ) : (
                <SessionList
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSelectSession={(id) => {
                    onSelectSession(id);
                    setIsOpen(false);
                  }}
                  onDeleteSession={onDeleteSession}
                />
              )}
            </div>

            <div className="p-3 border-t border-[var(--border-subtle)]">
              <ProfileNavItem
                variant="sidebar"
                onNavigate={(path) => {
                  setIsOpen(false);
                  if (typeof window !== 'undefined') {
                    window.location.href = path;
                  }
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function DesktopSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  sessions,
  isLoading,
  error,
  reload,
  onDeleteSession
}: SidebarProps & { reload: () => void }) {
  const pathname = usePathname();
  const derivedSessionId = currentSessionId || pathname?.split('/')[2];

  useEffect(() => {
    reload();
  }, [pathname, reload]);

  return (
    <aside className="hidden w-72 border-r border-[var(--border-subtle)] lg:flex flex-col bg-[var(--bg-secondary)]">
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <Button
          variant="outline"
          className="w-full border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-default)] bg-[var(--surface-primary)] rounded-xl h-10 text-sm font-medium group"
          onClick={onNewChat}
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-[10px] font-semibold text-[var(--text-tertiary)] mb-2 px-2 uppercase tracking-wider">
          Recent
        </h3>

        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-2.5 rounded-xl bg-[var(--surface-primary)] animate-pulse">
                <Skeleton className="h-4 w-3/4 bg-[var(--surface-secondary)]" />
                <Skeleton className="h-3 w-1/3 mt-2 bg-[var(--surface-secondary)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6 text-xs text-[var(--text-tertiary)] bg-[var(--error-soft)] rounded-xl">
            {error}
          </div>
        ) : (
          <SessionList
            sessions={sessions}
            currentSessionId={derivedSessionId}
            onSelectSession={onSelectSession}
            onDeleteSession={onDeleteSession}
          />
        )}
      </div>

      <div className="p-3 border-t border-[var(--border-subtle)]">
        <ProfileNavItem
          variant="sidebar"
          onNavigate={(path) => {
            if (typeof window !== 'undefined') {
              window.location.href = path;
            }
          }}
        />
      </div>
    </aside>
  );
}

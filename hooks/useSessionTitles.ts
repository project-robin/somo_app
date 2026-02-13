'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { astroShivaClient, Session } from '@/lib/api-client';

export interface SessionWithTitle extends Session {
  displayTitle: string;
}

const titleCache = new Map<string, string>();

export function useSessionTitles() {
  const { isLoaded, isSignedIn } = useAuth();
  const [sessions, setSessions] = useState<SessionWithTitle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateSessionTitle = useCallback((session: Session, firstMessage?: string): string => {
    if (session.summary && session.summary !== 'New Chat' && session.summary.trim()) {
      titleCache.set(session.id, session.summary);
      return session.summary;
    }

    const cached = titleCache.get(session.id);
    if (cached) return cached;

    if (firstMessage) {
      const cleanMessage = firstMessage
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const words = cleanMessage.split(' ').filter(w => w.length > 0).slice(0, 6);
      let title = words.join(' ');

      if (title) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
        if (cleanMessage.length > title.length) {
          title += '...';
        }
        titleCache.set(session.id, title);
        return title;
      }
    }

    const date = new Date(session.createdAt);
    const fallback = `Chat ${date.toLocaleDateString()}`;
    titleCache.set(session.id, fallback);
    return fallback;
  }, []);

  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    titleCache.set(sessionId, title);
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId ? { ...s, displayTitle: title } : s
      )
    );
  }, []);

  const loadSessions = useCallback(async (forceRefresh = false) => {
    if (!isSignedIn) {
      setSessions([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await astroShivaClient.getSessions(undefined, 50, 0);

      if (!response.success) {
        setError('Failed to load sessions');
        return;
      }

      const sessionsWithTitles = await Promise.all(
        response.data.sessions.map(async (session) => {
          const cachedTitle = titleCache.get(session.id);
          if (cachedTitle && !forceRefresh) {
            return { ...session, displayTitle: cachedTitle };
          }

          if (session.summary && session.summary !== 'New Chat' && session.summary.trim()) {
            titleCache.set(session.id, session.summary);
            return { ...session, displayTitle: session.summary };
          }

          try {
            const messagesResponse = await astroShivaClient.getSessionMessages(
              session.id,
              undefined,
              1,
              0
            );

            const firstUserMessage = messagesResponse.success && messagesResponse.data.messages.length > 0
              ? messagesResponse.data.messages.find(m => m.role === 'user')?.content
              : undefined;

            return {
              ...session,
              displayTitle: generateSessionTitle(session, firstUserMessage),
            };
          } catch {
            return {
              ...session,
              displayTitle: generateSessionTitle(session),
            };
          }
        })
      );

      setSessions(sessionsWithTitles);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, generateSessionTitle]);

  useEffect(() => {
    if (!isLoaded) return;
    loadSessions();
  }, [isLoaded, loadSessions]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    sessions,
    setSessions,
    isLoading,
    error,
    reload: loadSessions,
    updateSessionTitle,
  };
}

export { titleCache };

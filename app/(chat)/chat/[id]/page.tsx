'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, MessageSquare, ChevronDown } from 'lucide-react';
import { useChatSession } from '@/hooks/useChatSession';
import { useSessionTitles } from '@/hooks/useSessionTitles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar, DesktopSidebar } from '@/components/Sidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { astroShivaClient } from '@/lib/api-client';

export default function ExistingChatPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const { isLoaded, isSignedIn } = useAuth();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    messages,
    isStreaming,
    currentSessionId,
    sessionTitle,
    isLoadingSession,
    sendMessage,
    clearSession,
    loadSession,
    scrollToBottom,
    messagesEndRef,
    scrollContainerRef,
    setSessionTitle,
  } = useChatSession({ initialSessionId: sessionId });

  // Handle scroll to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 0);
  }, [messages.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const {
    sessions,
    isLoading: isLoadingSessions,
    error: sessionsError,
    reload: reloadSessions,
    updateSessionTitle,
  } = useSessionTitles();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  useEffect(() => {
    if (currentSessionId && sessionTitle) {
      updateSessionTitle(currentSessionId, sessionTitle);
    }
  }, [currentSessionId, sessionTitle, updateSessionTitle]);

  useEffect(() => {
    const fetchSessionTitle = async () => {
      if (sessionId && !sessionTitle) {
        try {
          const response = await astroShivaClient.getSessionMessages(sessionId, undefined, 1, 0);
          if (response.success && response.data.session?.title) {
            setSessionTitle(response.data.session.title);
          } else if (response.success && response.data.messages.length > 0) {
            const firstUserMessage = response.data.messages.find(m => m.role === 'user');
            if (firstUserMessage) {
              const title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
              setSessionTitle(title.charAt(0).toUpperCase() + title.slice(1));
            }
          }
        } catch (e) {
          console.error('Failed to fetch session title:', e);
        }
      }
    };
    fetchSessionTitle();
  }, [sessionId, sessionTitle, setSessionTitle]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !isSignedIn) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
    reloadSessions();
  };

  const handleNewChat = () => {
    clearSession();
    router.push('/chat');
  };

  const handleSelectSession = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleDeleteSession = async (sid: string) => {
    try {
      await astroShivaClient.deleteSession(sid);
      reloadSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] grok">
      <DesktopSidebar
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        sessions={sessions}
        isLoading={isLoadingSessions}
        error={sessionsError}
        reload={reloadSessions}
        onDeleteSession={handleDeleteSession}
      />

      <Sidebar
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        sessions={sessions}
        isLoading={isLoadingSessions}
        error={sessionsError}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {sessionTitle && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-10"
          >
            <h1 className="text-sm font-medium text-[var(--text-secondary)] truncate max-w-2xl mx-auto flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-warm)]" />
              {sessionTitle}
            </h1>
          </motion.div>
        )}

        <div
          className="flex-1 overflow-y-auto p-4 scroll-smooth relative"
          ref={scrollContainerRef}
        >
          {!isLoaded || isLoadingSession ? (
            <div className="space-y-4 max-w-2xl mx-auto pt-8">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--surface-secondary)] rounded-lg w-3/4 animate-pulse" />
                    <div className="h-4 bg-[var(--surface-secondary)] rounded-lg w-1/2 animate-pulse" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center max-w-md px-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[var(--text-tertiary)]" />
                </div>
                <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  No messages yet
                </h2>
                <p className="text-[var(--text-tertiary)] text-sm">
                  Start a conversation by typing a message below.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto pb-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.displayId}
                    message={message}
                    isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
                  />
                ))}
              </AnimatePresence>


              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scrollToBottom(true, 'smooth')}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] flex items-center justify-center shadow-lg transition-all duration-200 z-10"
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming || !isLoaded || !isSignedIn}
                className="w-full bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-warm)] focus:bg-[var(--surface-secondary)] rounded-xl h-11 text-sm pr-12 transition-all duration-200"
              />
              <AnimatePresence>
                {isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)]"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isStreaming || !isLoaded || !isSignedIn}
              className="bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-warm-soft)] hover:opacity-90 text-[var(--bg-primary)] border-0 rounded-xl h-11 px-5 transition-all duration-200 disabled:opacity-50 font-medium"
            >
              {isStreaming ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

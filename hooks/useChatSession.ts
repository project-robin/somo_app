'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { astroShivaClient, ChatMessage } from '@/lib/api-client';

export type MessageStatus = 'pending' | 'sending' | 'streaming' | 'complete' | 'error';

export interface EnhancedChatMessage extends ChatMessage {
  status: MessageStatus;
  displayId: string;
}

export interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed';
  startTime: number;
}

export interface ChatSessionState {
  messages: EnhancedChatMessage[];
  isStreaming: boolean;
  isThinking: boolean;
  currentSessionId: string | undefined;
  activeTools: ToolCall[];
  sessionTitle: string;
  isLoadingSession: boolean;
  error: string | null;
}

export interface UseChatSessionOptions {
  initialSessionId?: string;
  onLoadSession?: (sessionId: string) => Promise<ChatMessage[]>;
}

export function useChatSession(options: UseChatSessionOptions = {}) {
  const { initialSessionId, onLoadSession } = options;

  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId);
  const [activeTools, setActiveTools] = useState<ToolCall[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isLoadingSession, setIsLoadingSession] = useState(!!initialSessionId);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const streamingPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((force = false, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollContainerRef.current || !messagesEndRef.current) return;

    const container = scrollContainerRef.current;
    const scrollThreshold = 200;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;

    if (force || isNearBottom || shouldAutoScrollRef.current) {
      // Use scrollTo for more reliable scrolling
      const scrollTop = container.scrollHeight - container.clientHeight;
      container.scrollTo({ top: scrollTop, behavior });
    }
  }, []);

  const startStreamingScroll = useCallback(() => {
    if (streamingPollIntervalRef.current) {
      clearInterval(streamingPollIntervalRef.current);
    }
    streamingPollIntervalRef.current = setInterval(() => {
      scrollToBottom();
    }, 100);
  }, [scrollToBottom]);

  const stopStreamingScroll = useCallback(() => {
    if (streamingPollIntervalRef.current) {
      clearInterval(streamingPollIntervalRef.current);
      streamingPollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStreamingScroll();
    };
  }, [stopStreamingScroll]);

  // Enhanced auto-scroll effect with multiple triggers
  useEffect(() => {
    // Immediate scroll for new messages
    scrollToBottom(true, 'auto');

    // Follow-up smooth scroll after content renders
    const timeoutId = setTimeout(() => {
      scrollToBottom(true, 'smooth');
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [messages.length, scrollToBottom]);

  // Separate effect for thinking/tools with more aggressive scrolling
  useEffect(() => {
    if (isThinking || activeTools.length > 0) {
      scrollToBottom(true, 'smooth');
    }
  }, [isThinking, activeTools.length, scrollToBottom]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoadingSession(true);
    setError(null);

    try {
      const response = await astroShivaClient.getSessionMessages(sessionId, undefined, 50, 0);

      if (response.success) {
        const enhancedMessages: EnhancedChatMessage[] = response.data.messages.map(msg => ({
          ...msg,
          status: 'complete' as MessageStatus,
          displayId: msg.id || `loaded-${Date.now()}-${Math.random()}`,
        }));
        setMessages(enhancedMessages);
        setCurrentSessionId(sessionId);

        if (response.data.session?.title) {
          setSessionTitle(response.data.session.title);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    if (initialSessionId && onLoadSession) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId, onLoadSession, loadSession]);

  const generateSessionTitle = useCallback((content: string): string => {
    const cleanContent = content.replace(/[^\w\s]/g, ' ').trim();
    const words = cleanContent.split(/\s+/).slice(0, 6);
    let title = words.join(' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (content.length > title.length) title += '...';
    return title || 'New Chat';
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    const userDisplayId = `user-${Date.now()}`;
    const trimmedContent = content.trim();

    const userMessage: EnhancedChatMessage = {
      id: `temp-${Date.now()}`,
      displayId: userDisplayId,
      role: 'user',
      content: trimmedContent,
      status: 'sending',
      intentTag: null,
      createdAt: new Date().toISOString(),
      sessionId: currentSessionId || '',
      tokensUsed: null,
      model: null,
    };

    setMessages(prev => [...prev, userMessage]);

    if (!currentSessionId && messages.length === 0) {
      setSessionTitle(generateSessionTitle(trimmedContent));
    }

    // Immediate scroll to show the new user message
    setTimeout(() => scrollToBottom(true, 'auto'), 0);
    // Smooth scroll after animation
    setTimeout(() => scrollToBottom(true, 'smooth'), 100);

    setIsStreaming(true);
    setIsThinking(false);
    setActiveTools([]);

    startStreamingScroll();

    let currentTools: ToolCall[] = [];

    try {
      let assistantDisplayId = `assistant-${Date.now()}`;
      let hasReceivedResponse = false;

      for await (const chunk of astroShivaClient.streamChat(trimmedContent, currentSessionId)) {
        if (chunk.type === 'session-id' && 'sessionId' in chunk) {
          setCurrentSessionId(chunk.sessionId);
          window.history.replaceState(null, '', `/chat/${chunk.sessionId}`);
        } else if (chunk.type === 'thinking' && chunk.content) {
          setIsThinking(true);

          const toolMatch = chunk.content.match(/Using tool:\s*(\w+)/i) ||
                           chunk.content.match(/(\w+)\s*chart/i) ||
                           chunk.content.match(/Analyzing\s*(\w+)/i);

          if (toolMatch) {
            const toolName = toolMatch[1];
            const existingTool = currentTools.find(t => t.name === toolName);

            if (!existingTool) {
              const newTool: ToolCall = {
                id: `tool-${Date.now()}-${Math.random()}`,
                name: toolName,
                status: 'running',
                startTime: Date.now(),
              };
              currentTools = [...currentTools, newTool];
              setActiveTools(currentTools);
            }
          }
        } else if (chunk.type === 'chunk' && chunk.content) {
          setIsThinking(false);
          hasReceivedResponse = true;

          currentTools = currentTools.map(t => ({ ...t, status: 'completed' as const }));
          setActiveTools(currentTools);

          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];

            if (lastMessage && lastMessage.role === 'assistant') {
              const newMessages = [...prev.slice(0, -1)];
              newMessages.push({
                ...lastMessage,
                content: (lastMessage.content || '') + chunk.content,
                status: 'streaming',
              });
              return newMessages;
            } else {
              const assistantMessage: EnhancedChatMessage = {
                id: `assistant-${Date.now()}`,
                displayId: assistantDisplayId,
                role: 'assistant',
                content: chunk.content,
                status: 'streaming',
                intentTag: null,
                createdAt: new Date().toISOString(),
                sessionId: currentSessionId || '',
                tokensUsed: null,
                model: null,
              };
              return [...prev, assistantMessage];
            }
          });
        }
      }

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          return prev.map(msg =>
            msg.displayId === userDisplayId ? { ...msg, status: 'complete' as MessageStatus } : msg
          );
        }
        return prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, status: 'complete' as MessageStatus } : msg
        );
      });

      if (!hasReceivedResponse) {
        const errorMessage: EnhancedChatMessage = {
          id: `error-${Date.now()}`,
          displayId: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I was unable to generate a response. Please try again.',
          status: 'error',
          intentTag: null,
          createdAt: new Date().toISOString(),
          sessionId: currentSessionId || '',
          tokensUsed: null,
          model: null,
        };
        setMessages(prev => [...prev, errorMessage]);
      }

      setTimeout(() => {
        setActiveTools([]);
      }, 2000);

      // Final scroll to ensure everything is visible
      setTimeout(() => scrollToBottom(true, 'smooth'), 150);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.displayId === userDisplayId ? { ...msg, status: 'error' as MessageStatus } : msg
        );

        const assistantMessage: EnhancedChatMessage = {
          id: `error-${Date.now()}`,
          displayId: `error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, there was an error: ${errorMessage}`,
          status: 'error',
          intentTag: null,
          createdAt: new Date().toISOString(),
          sessionId: currentSessionId || '',
          tokensUsed: null,
          model: null,
        };
        return [...updated, assistantMessage];
      });

      setError(errorMessage);
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      stopStreamingScroll();

      // Multiple scroll attempts to ensure final position
      setTimeout(() => scrollToBottom(true, 'smooth'), 100);
      setTimeout(() => scrollToBottom(true, 'smooth'), 300);
    }
  }, [currentSessionId, isStreaming, messages.length, generateSessionTitle, scrollToBottom, startStreamingScroll, stopStreamingScroll]);

  const clearSession = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(undefined);
    setSessionTitle('');
    setActiveTools([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    isThinking,
    currentSessionId,
    activeTools,
    sessionTitle,
    isLoadingSession,
    error,
    sendMessage,
    clearSession,
    loadSession,
    scrollToBottom,
    messagesEndRef,
    scrollContainerRef,
    setSessionTitle,
  };
}

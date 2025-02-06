'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
} from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { Message, LLMResponse } from '@/lib/types';
import { getLLMResponse } from '@/services/llm';
import { formatMessageTimestamp } from '@/utils/date';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chat_history';

const ChatApp = () => {
  // Load messages from localStorage (if any) when the component mounts.
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) as Message[] : [];
      } catch (error) {
        console.error('Failed to load chat history:', error);
        return [];
      }
    }
    return [];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save conversation history to localStorage whenever messages update.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  // Auto-scroll to the bottom of the messages list.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refocus the input field when loading is finished.
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Hotkeys configuration.
  useHotkeys(
    'ctrl+enter',
    (event) => {
      event.preventDefault();
      handleSubmit();
    },
    { enableOnFormTags: true },
    [inputMessage, isLoading]
  );
  useHotkeys('esc', () => setInputMessage(''), { enableOnFormTags: true });

  // Helper to append a message to the conversation.
  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Helper to clear the entire chat history.
  const clearHistory = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, []);

  // Handler for form submission (sending a message).
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      if (!inputMessage.trim() || isLoading) return;

      // Create the user's message.
      const userMessage: Message = {
        id: uuidv4(),
        content: inputMessage.trim(),
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      // Update the UI immediately.
      appendMessage(userMessage);
      setInputMessage('');
      setIsLoading(true);

      // Build the updated conversation history.
      const updatedMessages = [...messages, userMessage];

      try {
        // Call the LLM service passing the input message and full conversation history.
        const response: LLMResponse = await getLLMResponse(inputMessage, updatedMessages);
        console.log('LLM response:', response);

        const botMessage: Message = {
          id: uuidv4(),
          content: response.message,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isError: !!response.error,
          usage: response.usage || undefined,
          model: response.model,
          systemFingerprint: response.systemFingerprint,
        };
        appendMessage(botMessage);
      } catch (error) {
        console.error('Error in getLLMResponse:', error);
        const errorMessage: Message = {
          id: uuidv4(),
          content: 'Sorry, I encountered an error processing your request.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isError: true,
        };
        appendMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, appendMessage, messages]
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
        <Card className="flex-grow overflow-hidden flex flex-col glass card-shadow">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="chat-heading flex items-center gap-2 text-lg font-semibold">
              <Bot className="w-5 h-5" aria-label="Bot icon" />
              Chat Assistant
            </h1>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearHistory}
                      className="rounded-full hover:bg-destructive/10"
                      aria-label="Clear chat history"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear chat history</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Message List */}
          <div
            className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-custom"
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bot className="w-12 h-12 mb-4" aria-label="Bot icon" />
                <p className="text-center">
                  No messages yet. Start a conversation!
                </p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`message-bubble ${
                      message.sender === 'user'
                        ? 'message-bubble-user'
                        : 'message-bubble-bot'
                    } ${message.isError ? 'bg-destructive/10 text-destructive' : ''} hover-scale`}
                  >
                    <div className="flex items-center gap-2 mb-1 message-meta">
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4" aria-label="User icon" />
                      ) : (
                        <Bot className="w-4 h-4" aria-label="Bot icon" />
                      )}
                      <span className="text-xs opacity-75">
                        {formatMessageTimestamp(message.timestamp)}
                      </span>
                      {message.model && (
                        <span className="text-xs opacity-75 ml-2">
                          {message.model}
                        </span>
                      )}
                    </div>
                    <div className="message-text prose prose-sm dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    {message.usage && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div className="flex gap-2 items-center">
                          <span>Tokens: {message.usage.totalTokens}</span>
                          {message.usage.completionTokensDetails && (
                            <span>
                              • Reasoning:{' '}
                              {message.usage.completionTokensDetails.reasoningTokens}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="w-4 h-4 animate-spin" aria-label="Loading" />
                <span className="text-sm">Thinking...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-background/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message... (Ctrl+Enter to send)"
                className="flex-grow focus-ring"
                disabled={isLoading}
                aria-label="Message input"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="hover-scale"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-label="Loading" />
                    ) : (
                      <Send className="w-4 h-4" aria-label="Send" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send message (Ctrl+Enter)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default ChatApp;

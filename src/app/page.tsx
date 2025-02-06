'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import { Message } from '@/lib/types';
import { getLLMResponse } from '@/services/llm';
import { formatMessageTimestamp } from '@/utils/date';
import { v4 as uuidv4 } from 'uuid';

const ChatApp = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom whenever messages update.
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Create a user message including a unique id.
    const userMessage: Message = {
      id: uuidv4(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add the user's message.
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Fetch the bot's response.
      const response = await getLLMResponse(inputMessage);
      const botMessage: Message = {
        id: uuidv4(),
        content: response.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: !!response.error,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      // Handle errors by showing an error message.
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Sorry, I encountered an error processing your request.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="flex-grow overflow-hidden flex flex-col glass card-shadow">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="chat-heading flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Chat Assistant
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-custom">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } message-appear`}
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
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span>{formatMessageTimestamp(message.timestamp)}</span>
                </div>
                <p className="message-text">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground message-appear">
              <Bot className="w-4 h-4" />
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-background/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow p-2 rounded-lg bg-background focus-ring"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="hover-scale"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChatApp;

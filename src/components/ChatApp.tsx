'use client';

import React, { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { Message, LLMResponse } from '@/lib/types';
import { getLLMResponse } from '@/services/llm';
import { formatMessageTimestamp } from '@/utils/date';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chat_history';
const NAME_STORAGE_KEY = 'user_name';

const ChatApp = () => {
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
  }, []);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      if (!inputMessage.trim() || isLoading) return;

      const userMessage: Message = {
        id: uuidv4(),
        content: inputMessage.trim(),
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      appendMessage(userMessage);
      setInputMessage('');
      setIsLoading(true);

      try {
        const response: LLMResponse = await getLLMResponse(inputMessage, updatedMessages);
        const botMessage: Message = {
          id: uuidv4(),
          content: response.message,
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };
        appendMessage(botMessage);
      } catch (error) {
        console.error('Error in getLLMResponse:', error);
        appendMessage({
          id: uuidv4(),
          content: 'Sorry, I encountered an error processing your request.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isError: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, appendMessage, messages]
  );

  return (
    <Card className="flex flex-col h-screen p-4">
      <Button onClick={clearHistory}><Trash2 /> Clear Chat</Button>
      <div className="flex-grow overflow-y-auto p-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id}><p>{msg.content}</p></motion.div>
          ))}
        </AnimatePresence>
        {isLoading && <Loader2 className="animate-spin" />}
      </div>
      <form onSubmit={handleSubmit}>
        <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} />
        <Button type="submit"><Send /></Button>
      </form>
    </Card>
  );
};

export default ChatApp;

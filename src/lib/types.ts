export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'developer'; // ✅ Fixed the allowed roles
  content: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isError?: boolean;
}

export interface LLMResponse {
  message: string;
  error?: string;
}

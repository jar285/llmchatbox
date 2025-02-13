import { LLMResponse, Message, ChatMessage } from '@/lib/types';

const NAME_STORAGE_KEY = 'user_name';
const HISTORY_STORAGE_KEY = 'chat_history';

/**
 * Extracts and stores the user's name if they introduce themselves.
 */
function extractUserName(messages: Message[]): string | null {
  for (const msg of messages) {
    if (msg.sender === 'user' && /i[’'`]?\s?m\s([A-Za-z]+)/i.test(msg.content)) {
      const nameMatch = msg.content.match(/i[’'`]?\s?m\s([A-Za-z]+)/i);
      if (nameMatch) {
        const userName = nameMatch[1].trim();
        localStorage.setItem(NAME_STORAGE_KEY, userName); // ✅ Store name persistently
        return userName;
      }
    }
  }
  return localStorage.getItem(NAME_STORAGE_KEY); // ✅ Retrieve stored name if available
}

/**
 * Saves conversation history to `localStorage`.
 */
function saveChatHistory(messages: Message[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages));
}

/**
 * Retrieves conversation history from `localStorage`.
 */
function loadChatHistory(): Message[] {
  const history = localStorage.getItem(HISTORY_STORAGE_KEY);
  return history ? JSON.parse(history) : [];
}

/**
 * Calls the LLM API and ensures memory persistence.
 */
export async function getLLMResponse(userInput: string, previousMessages: Message[] = []): Promise<LLMResponse> {
  const userName = extractUserName(previousMessages) || 'User';
  const conversationHistory = [...loadChatHistory(), ...previousMessages];

  // Use the system prompt from environment variables
  const systemPrompt = process.env.NEXT_PUBLIC_SYSTEM_PROMPT || 
    `You are a helpful AI assistant. The user's name is "${userName}" if they told you. Always remember it and use it in responses. Also, remember the topics you have discussed.`;

  const messages: ChatMessage[] = [
    { role: 'system' as 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? ('user' as 'user') : ('assistant' as 'assistant'),
      content: msg.content
    })),
    { role: 'user' as 'user', content: userInput }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ 
        model: process.env.NEXT_PUBLIC_MODEL || 'gpt-4-turbo', 
        messages 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API Error: ${response.status} - ${response.statusText}`);
    }

    // ✅ Store bot's response in memory
    const botMessage: Message = {
      id: `${Date.now()}-bot`,
      content: data.choices[0].message.content,
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };
    saveChatHistory([...conversationHistory, botMessage]);

    return { message: botMessage.content };
  } catch (error: unknown) {
    console.error('Error in getLLMResponse:', error);

    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return { message: 'Sorry, I encountered an error processing your request.', error: errorMessage };
  }
}

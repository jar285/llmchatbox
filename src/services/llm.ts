import { LLMResponse, Message, ChatMessage } from '@/lib/types';

function convertToChatMessages(messages: Message[]): ChatMessage[] {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}

export async function getLLMResponse(message: string, previousMessages: Message[] = []): Promise<LLMResponse> {
  try {
    const systemPrompt = process.env.NEXT_PUBLIC_SYSTEM_PROMPT || 'You are a helpful assistant.';
    const model = process.env.NEXT_PUBLIC_MODEL || 'o3-mini-2025-01-31';
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      return {
        message: '',
        error: 'API key is not configured'
      };
    }

    // Convert previous messages and create the messages array
    const conversationHistory = convertToChatMessages(previousMessages);
    const messages: ChatMessage[] = [
      {
        role: 'developer',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const requestBody = {
      model,
      messages
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        message: '',
        error: data.error?.message || `API Error: ${response.status} - ${response.statusText}`
      };
    }

    return {
      message: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        completionTokensDetails: data.usage.completion_tokens_details ? {
          reasoningTokens: data.usage.completion_tokens_details.reasoning_tokens,
          acceptedPredictionTokens: data.usage.completion_tokens_details.accepted_prediction_tokens,
          rejectedPredictionTokens: data.usage.completion_tokens_details.rejected_prediction_tokens
        } : undefined
      } : null,
      model: data.model,
      systemFingerprint: data.system_fingerprint
    };

  } catch (error) {
    console.error('Error in getLLMResponse:', error);
    return {
      message: '',
      error: error instanceof Error ? error.message : 'Failed to get response'
    };
  }
}
// Import uuid function to use within the conversion utility.
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a message format used by the external Chat API.
 */
export interface ChatMessage {
  /**
   * The role of the sender as defined by the API.
   */
  role: 'developer' | 'user' | 'assistant';
  /**
   * The content of the message.
   */
  content: string;
}

/**
 * Represents a chat message exchanged between the user and the bot.
 */
export interface Message {
  /**
   * A unique identifier for the message.
   */
  id: string;
  /**
   * The text content of the message.
   */
  content: string;
  /**
   * Who sent the message.
   */
  sender: 'user' | 'bot';
  /**
   * ISO timestamp indicating when the message was sent.
   */
  timestamp: string;
  /**
   * Indicates whether the message represents an error.
   */
  isError?: boolean;
  /**
   * (Optional) Token usage details if available.
   */
  usage?: TokenUsage;
  /**
   * (Optional) The model used to generate this message.
   */
  model?: string;
  /**
   * (Optional) A fingerprint representing the system that produced this message.
   */
  systemFingerprint?: string;
}

/**
 * Represents the response returned from the language model.
 */
export interface LLMResponse {
  /**
   * The generated message from the language model.
   */
  message: string;
  /**
   * (Optional) An error message if something went wrong.
   */
  error?: string;
  /**
   * (Optional) Token usage details for the request.
   */
  usage?: TokenUsage | null;
  /**
   * (Optional) The model that produced the response.
   */
  model?: string;
  /**
   * (Optional) A fingerprint representing the system that processed the request.
   */
  systemFingerprint?: string;
}

/**
 * Contains details about token usage during a request.
 */
export interface TokenUsage {
  /**
   * The number of tokens used in the prompt.
   */
  promptTokens: number;
  /**
   * The number of tokens generated in the response.
   */
  completionTokens: number;
  /**
   * The total number of tokens used.
   */
  totalTokens: number;
  /**
   * (Optional) Detailed breakdown for completion tokens.
   */
  completionTokensDetails?: {
    /**
     * The number of tokens used for reasoning.
     */
    reasoningTokens: number;
    /**
     * The number of prediction tokens that were accepted.
     */
    acceptedPredictionTokens: number;
    /**
     * The number of prediction tokens that were rejected.
     */
    rejectedPredictionTokens: number;
  };
}

/**
 * Utility function to convert a ChatMessage (from an external API) into the internal Message format.
 *
 * This function maps:
 * - `role: 'assistant'` → `sender: 'bot'`
 * - Other roles (like 'user') remain as `sender: 'user'`
 * - It also generates a unique id and a timestamp.
 *
 * @param chatMessage The ChatMessage received from the API.
 * @returns A Message formatted for internal use.
 */
export function convertChatMessageToMessage(chatMessage: ChatMessage): Message {
  return {
    id: uuidv4(),
    content: chatMessage.content,
    sender: chatMessage.role === 'assistant' ? 'bot' : 'user',
    timestamp: new Date().toISOString(),
  };
}

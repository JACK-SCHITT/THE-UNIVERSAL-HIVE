export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id?: string;
  title: string;
  system_prompt: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface FraudAlert {
  id: string;
  user_id?: string;
  message: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_score: number;
  created_at: string;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  toolResults?: any;
}

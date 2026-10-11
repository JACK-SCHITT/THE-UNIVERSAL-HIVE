export interface AuthUser {
  id: string
  email: string
  username: string
}

export interface Game {
  id: string
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  login_url: string | null
  game_type: 'web' | 'mobile' | 'desktop'
  requires_credentials: boolean
  automation_enabled: boolean
  created_at: string
  updated_at: string
}

export interface GameCredential {
  id: string
  user_id: string
  game_id: string
  username: string | null
  encrypted_password: string | null
  additional_data: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GameSession {
  id: string
  user_id: string
  game_id: string
  session_type: 'learning' | 'playing' | 'manual'
  status: 'active' | 'paused' | 'completed' | 'failed'
  learning_progress: number
  actions_learned: number
  accuracy_rate: number
  started_at: string
  completed_at: string | null
  metadata: Record<string, unknown>
}

export interface GameAction {
  id: string
  user_id: string
  game_id: string
  session_id: string | null
  action_type: string
  action_data: Record<string, unknown>
  screen_context: Record<string, unknown> | null
  timestamp: string
  confidence_score: number
  success: boolean
}

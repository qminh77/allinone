/**
 * Database Types - Generated from Supabase Schema
 * 
 * Đây là các type TypeScript tương ứng với schema database
 */

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          module: string | null
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          description?: string | null
          module?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          description?: string | null
          module?: string | null
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          icon: string | null
          href: string | null
          category: string | null
          is_new: boolean
          is_popular: boolean
          is_enabled: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          description?: string | null
          icon?: string | null
          href?: string | null
          category?: string | null
          is_new?: boolean
          is_popular?: boolean
          is_enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          description?: string | null
          icon?: string | null
          href?: string | null
          category?: string | null
          is_new?: boolean
          is_popular?: boolean
          is_enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: any // JSONB
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value: any
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          key?: string
          value?: any
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
      }
      ai_providers: {
        Row: {
          id: string
          name: string
          slug: string
          adapter: 'openai_responses' | 'openai_chat' | 'openai_compatible' | 'gemini' | 'anthropic'
          base_url: string
          docs_url: string | null
          api_key_label: string | null
          encrypted_api_key: string | null
          is_enabled: boolean
          sort_order: number
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          adapter: 'openai_responses' | 'openai_chat' | 'openai_compatible' | 'gemini' | 'anthropic'
          base_url: string
          docs_url?: string | null
          api_key_label?: string | null
          encrypted_api_key?: string | null
          is_enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          adapter?: 'openai_responses' | 'openai_chat' | 'openai_compatible' | 'gemini' | 'anthropic'
          base_url?: string
          docs_url?: string | null
          api_key_label?: string | null
          encrypted_api_key?: string | null
          is_enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
      }
      ai_models: {
        Row: {
          id: string
          provider_id: string
          name: string
          model_id: string
          description: string | null
          capabilities: string[]
          context_window: number | null
          input_price_per_million: number | null
          output_price_per_million: number | null
          currency: string
          request_defaults: any
          is_enabled: boolean
          is_default: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          name: string
          model_id: string
          description?: string | null
          capabilities?: string[]
          context_window?: number | null
          input_price_per_million?: number | null
          output_price_per_million?: number | null
          currency?: string
          request_defaults?: any
          is_enabled?: boolean
          is_default?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          name?: string
          model_id?: string
          description?: string | null
          capabilities?: string[]
          context_window?: number | null
          input_price_per_million?: number | null
          output_price_per_million?: number | null
          currency?: string
          request_defaults?: any
          is_enabled?: boolean
          is_default?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string | null
          provider_id: string | null
          model_id: string | null
          feature_key: string
          prompt_tokens: number | null
          completion_tokens: number | null
          total_tokens: number | null
          status: 'success' | 'failed'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          provider_id?: string | null
          model_id?: string | null
          feature_key: string
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          status?: 'success' | 'failed'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          provider_id?: string | null
          model_id?: string | null
          feature_key?: string
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          status?: 'success' | 'failed'
          error_message?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: any | null // JSONB
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      backups: {
        Row: {
          id: string
          filename: string
          type: string
          size_bytes: number | null
          created_by: string | null
          created_at: string
          storage_path: string | null
        }
        Insert: {
          id?: string
          filename: string
          type: string
          size_bytes?: number | null
          created_by?: string | null
          created_at?: string
          storage_path?: string | null
        }
        Update: {
          id?: string
          filename?: string
          type?: string
          size_bytes?: number | null
          created_by?: string | null
          created_at?: string
          storage_path?: string | null
        }
      }
      shortlinks: {
        Row: {
          id: string
          user_id: string
          slug: string
          target_url: string
          password_hash: string | null
          expires_at: string | null
          clicks: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug: string
          target_url: string
          password_hash?: string | null
          expires_at?: string | null
          clicks?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          slug?: string
          target_url?: string
          password_hash?: string | null
          expires_at?: string | null
          clicks?: number
          created_at?: string
        }
      }
      smtp_configs: {
        Row: {
          id: string
          user_id: string
          name: string
          host: string
          port: number
          secure: boolean
          username: string | null
          encrypted_password: string | null
          from_email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          host: string
          port: number
          secure?: boolean
          username?: string | null
          encrypted_password?: string | null
          from_email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          host?: string
          port?: number
          secure?: boolean
          username?: string | null
          encrypted_password?: string | null
          from_email?: string
          created_at?: string
          updated_at?: string
        }
      }
      mail_history: {
        Row: {
          id: string
          user_id: string
          config_id: string | null
          recipients: string[]
          subject: string
          body: string | null
          status: 'success' | 'failed'
          error_message: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          user_id: string
          config_id?: string | null
          recipients: string[]
          subject: string
          body?: string | null
          status: 'success' | 'failed'
          error_message?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          config_id?: string | null
          recipients?: string[]
          subject?: string
          body?: string | null
          status?: 'success' | 'failed'
          error_message?: string | null
          sent_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          user_id: string
          is_public: boolean
          share_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          user_id: string
          is_public?: boolean
          share_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          user_id?: string
          is_public?: boolean
          share_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          content: string
          type: 'single' | 'multiple'
          explanation: string | null
          media_url: string | null
          media_type: 'image' | 'youtube' | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          content: string
          type?: 'single' | 'multiple'
          explanation?: string | null
          media_url?: string | null
          media_type?: 'image' | 'youtube' | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          content?: string
          type?: 'single' | 'multiple'
          explanation?: string | null
          media_url?: string | null
          media_type?: 'image' | 'youtube' | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      quiz_answers: {
        Row: {
          id: string
          question_id: string
          content: string
          is_correct: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          content: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          content?: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          user_id: string | null
          score: number
          total_questions: number
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id?: string | null
          score?: number
          total_questions?: number
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string | null
          score?: number
          total_questions?: number
          started_at?: string
          completed_at?: string | null
        }
      }
      quiz_attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          answer_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          answer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          answer_id?: string | null
          created_at?: string
        }
      }
      flashcard_sets: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          visibility: 'public' | 'private'
          share_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          visibility?: 'public' | 'private'
          share_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          visibility?: 'public' | 'private'
          share_token?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          id: string
          set_id: string
          term: string
          definition: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          set_id: string
          term: string
          definition: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          term?: string
          definition?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      flashcard_progress: {
        Row: {
          id: string
          set_id: string
          card_id: string
          user_id: string
          status: 'unknown' | 'known' | 'mastered'
          last_seen_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          set_id: string
          card_id: string
          user_id: string
          status?: 'unknown' | 'known' | 'mastered'
          last_seen_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          card_id?: string
          user_id?: string
          status?: 'unknown' | 'known' | 'mastered'
          last_seen_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'archived'
          definition: any
          schedule_cron: string | null
          last_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived'
          definition?: any
          schedule_cron?: string | null
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'archived'
          definition?: any
          schedule_cron?: string | null
          last_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          user_id: string
          status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
          trigger_type: 'manual' | 'schedule' | 'api'
          input: any
          output: any | null
          started_at: string | null
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          user_id: string
          status?: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
          trigger_type?: 'manual' | 'schedule' | 'api'
          input?: any
          output?: any | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          user_id?: string
          status?: 'queued' | 'running' | 'success' | 'failed' | 'cancelled'
          trigger_type?: 'manual' | 'schedule' | 'api'
          input?: any
          output?: any | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      workflow_execution_logs: {
        Row: {
          id: string
          execution_id: string
          workflow_id: string
          user_id: string
          node_id: string | null
          level: 'debug' | 'info' | 'warn' | 'error'
          message: string
          payload: any | null
          created_at: string
        }
        Insert: {
          id?: string
          execution_id: string
          workflow_id: string
          user_id: string
          node_id?: string | null
          level?: 'debug' | 'info' | 'warn' | 'error'
          message: string
          payload?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string
          workflow_id?: string
          user_id?: string
          node_id?: string | null
          level?: 'debug' | 'info' | 'warn' | 'error'
          message?: string
          payload?: any | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Role = Database['public']['Tables']['roles']['Row']
export type Permission = Database['public']['Tables']['permissions']['Row']
export type RolePermission = Database['public']['Tables']['role_permissions']['Row']
export type Module = Database['public']['Tables']['modules']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']
export type AiProvider = Database['public']['Tables']['ai_providers']['Row']
export type AiModel = Database['public']['Tables']['ai_models']['Row']
export type AiUsageLog = Database['public']['Tables']['ai_usage_logs']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type Backup = Database['public']['Tables']['backups']['Row']
export type Shortlink = Database['public']['Tables']['shortlinks']['Row']
export type SmtpConfig = Database['public']['Tables']['smtp_configs']['Row']
export type MailHistory = Database['public']['Tables']['mail_history']['Row']
export type FlashcardSet = Database['public']['Tables']['flashcard_sets']['Row']
export type Flashcard = Database['public']['Tables']['flashcards']['Row']
export type FlashcardProgress = Database['public']['Tables']['flashcard_progress']['Row']
export type Workflow = Database['public']['Tables']['workflows']['Row']
export type WorkflowExecution = Database['public']['Tables']['workflow_executions']['Row']
export type WorkflowExecutionLog = Database['public']['Tables']['workflow_execution_logs']['Row']

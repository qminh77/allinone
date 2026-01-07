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
          password: string | null
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
          password?: string | null
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
          password?: string | null
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
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type Backup = Database['public']['Tables']['backups']['Row']
export type Shortlink = Database['public']['Tables']['shortlinks']['Row']
export type SmtpConfig = Database['public']['Tables']['smtp_configs']['Row']
export type MailHistory = Database['public']['Tables']['mail_history']['Row']

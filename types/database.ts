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

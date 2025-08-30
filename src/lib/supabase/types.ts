export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chit_fund_members: {
        Row: {
          assigned_collector_id: string | null
          chit_fund_id: string
          created_at: string | null
          id: string
          joined_at: string
          member_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_collector_id?: string | null
          chit_fund_id: string
          created_at?: string | null
          id?: string
          joined_at?: string
          member_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_collector_id?: string | null
          chit_fund_id?: string
          created_at?: string | null
          id?: string
          joined_at?: string
          member_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chit_fund_members_assigned_collector_id_fkey"
            columns: ["assigned_collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_fund_members_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_fund_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      chit_funds: {
        Row: {
          created_at: string
          created_by: string
          duration_months: number
          id: string
          installment_amount: number
          name: string
          start_date: string
          status: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_months: number
          id?: string
          installment_amount: number
          name: string
          start_date: string
          status?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_months?: number
          id?: string
          installment_amount?: number
          name?: string
          start_date?: string
          status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chit_funds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      closing_sessions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments: string[] | null
          collector_id: string
          created_at: string
          declared_total: number
          entries_count: number | null
          id: string
          notes: string | null
          rejection_reason: string | null
          session_date: string
          status: string | null
          submitted_at: string | null
          system_total: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          collector_id: string
          created_at?: string
          declared_total: number
          entries_count?: number | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          session_date?: string
          status?: string | null
          submitted_at?: string | null
          system_total?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: string[] | null
          collector_id?: string
          created_at?: string
          declared_total?: number
          entries_count?: number | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          session_date?: string
          status?: string | null
          submitted_at?: string | null
          system_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "closing_sessions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closing_sessions_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_entries: {
        Row: {
          amount_collected: number
          chit_fund_id: string
          closing_session_id: string | null
          collection_date: string
          collection_time: string | null
          collector_id: string
          created_at: string
          cycle_id: string
          id: string
          member_id: string
          notes: string | null
          payment_method: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount_collected: number
          chit_fund_id: string
          closing_session_id?: string | null
          collection_date?: string
          collection_time?: string | null
          collector_id: string
          created_at?: string
          cycle_id: string
          id?: string
          member_id: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount_collected?: number
          chit_fund_id?: string
          closing_session_id?: string | null
          collection_date?: string
          collection_time?: string | null
          collector_id?: string
          created_at?: string
          cycle_id?: string
          id?: string
          member_id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_closing_session_id_fkey"
            columns: ["closing_session_id"]
            isOneToOne: false
            referencedRelation: "closing_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          chit_fund_id: string
          created_at: string
          cycle_date: string
          cycle_number: number
          id: string
          payout_amount: number | null
          status: string | null
          total_amount: number
          updated_at: string
          winner_member_id: string | null
        }
        Insert: {
          chit_fund_id: string
          created_at?: string
          cycle_date: string
          cycle_number: number
          id?: string
          payout_amount?: number | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          winner_member_id?: string | null
        }
        Update: {
          chit_fund_id?: string
          created_at?: string
          cycle_date?: string
          cycle_number?: number
          id?: string
          payout_amount?: number | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          winner_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cycles_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycles_winner_member_id_fkey"
            columns: ["winner_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string
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

type DefaultSchema = Database['public']

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Update']
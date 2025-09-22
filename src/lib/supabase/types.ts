export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cashbook: {
        Row: {
          amount: number
          chit_fund_id: string
          closing_session_id: string | null
          collector_id: string | null
          created_at: string | null
          cycle_id: string | null
          id: string
          member_id: string
          notes: string | null
          payment_method: string | null
          payout_id: string | null
          processed_by: string | null
          receipt_number: string | null
          reference_number: string | null
          running_balance: number | null
          status: string | null
          transaction_date: string
          transaction_description: string
          transaction_time: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          chit_fund_id: string
          closing_session_id?: string | null
          collector_id?: string | null
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          member_id: string
          notes?: string | null
          payment_method?: string | null
          payout_id?: string | null
          processed_by?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          running_balance?: number | null
          status?: string | null
          transaction_date?: string
          transaction_description: string
          transaction_time?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          chit_fund_id?: string
          closing_session_id?: string | null
          collector_id?: string | null
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          payment_method?: string | null
          payout_id?: string | null
          processed_by?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          running_balance?: number | null
          status?: string | null
          transaction_date?: string
          transaction_description?: string
          transaction_time?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_closing_session_id_fkey"
            columns: ["closing_session_id"]
            isOneToOne: false
            referencedRelation: "closing_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["current_cycle_id"]
          },
          {
            foreignKeyName: "cashbook_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "chit_fund_members_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_fund_members_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_fund_members_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_fund_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
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
          cycle_interval_type: string | null
          cycle_interval_value: number | null
          duration_months: number
          id: string
          installment_per_member: number
          max_members: number | null
          name: string
          start_date: string
          status: string | null
          total_amount: number
          total_cycles: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          cycle_interval_type?: string | null
          cycle_interval_value?: number | null
          duration_months: number
          id?: string
          installment_per_member: number
          max_members?: number | null
          name: string
          start_date: string
          status?: string | null
          total_amount: number
          total_cycles: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          cycle_interval_type?: string | null
          cycle_interval_value?: number | null
          duration_months?: number
          id?: string
          installment_per_member?: number
          max_members?: number | null
          name?: string
          start_date?: string
          status?: string | null
          total_amount?: number
          total_cycles?: number
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
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
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
            foreignKeyName: "collection_entries_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["current_cycle_id"]
          },
          {
            foreignKeyName: "collection_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
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
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "cycles_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycles_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycles_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycles_winner_member_id_fkey"
            columns: ["winner_member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
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
      member_balances: {
        Row: {
          advance_balance: number | null
          arrears_amount: number | null
          chit_fund_id: string
          created_at: string | null
          id: string
          last_payment_cycle_id: string | null
          last_payment_date: string | null
          member_id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          advance_balance?: number | null
          arrears_amount?: number | null
          chit_fund_id: string
          created_at?: string | null
          id?: string
          last_payment_cycle_id?: string | null
          last_payment_date?: string | null
          member_id: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          advance_balance?: number | null
          arrears_amount?: number | null
          chit_fund_id?: string
          created_at?: string | null
          id?: string
          last_payment_cycle_id?: string | null
          last_payment_date?: string | null
          member_id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_balances_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "member_balances_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_balances_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_balances_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_balances_last_payment_cycle_id_fkey"
            columns: ["last_payment_cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_balances_last_payment_cycle_id_fkey"
            columns: ["last_payment_cycle_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["current_cycle_id"]
          },
          {
            foreignKeyName: "member_balances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_balances_member_id_fkey"
            columns: ["member_id"]
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
      payouts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_details: string | null
          cheque_number: string | null
          chit_fund_id: string
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string | null
          created_by: string
          cycle_id: string
          id: string
          net_payout_amount: number
          notes: string | null
          payout_amount: number
          payout_date: string
          payout_method: string | null
          payout_time: string | null
          receipt_number: string
          status: string | null
          total_collected: number
          updated_at: string | null
          upi_transaction_id: string | null
          winner_member_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: string | null
          cheque_number?: string | null
          chit_fund_id: string
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          created_by: string
          cycle_id: string
          id?: string
          net_payout_amount: number
          notes?: string | null
          payout_amount: number
          payout_date?: string
          payout_method?: string | null
          payout_time?: string | null
          receipt_number: string
          status?: string | null
          total_collected: number
          updated_at?: string | null
          upi_transaction_id?: string | null
          winner_member_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: string | null
          cheque_number?: string | null
          chit_fund_id?: string
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          created_by?: string
          cycle_id?: string
          id?: string
          net_payout_amount?: number
          notes?: string | null
          payout_amount?: number
          payout_date?: string
          payout_method?: string | null
          payout_time?: string | null
          receipt_number?: string
          status?: string | null
          total_collected?: number
          updated_at?: string | null
          upi_transaction_id?: string | null
          winner_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "payouts_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["current_cycle_id"]
          },
          {
            foreignKeyName: "payouts_winner_member_id_fkey"
            columns: ["winner_member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_winner_member_id_fkey"
            columns: ["winner_member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      cash_position_summary: {
        Row: {
          activity_status: string | null
          chit_fund_id: string | null
          current_cash_balance: number | null
          fund_name: string | null
          fund_status: string | null
          last_transaction_date: string | null
          last_transaction_time: string | null
          today_cash_in: number | null
          today_cash_in_transactions: number | null
          today_cash_out: number | null
          today_cash_out_transactions: number | null
          today_net_flow: number | null
        }
        Relationships: []
      }
      cashbook_consolidated_view: {
        Row: {
          amount: number | null
          chit_fund_id: string | null
          closing_declared_total: number | null
          closing_session_date: string | null
          closing_session_id: string | null
          closing_session_status: string | null
          closing_system_total: number | null
          collector_id: string | null
          collector_name: string | null
          collector_phone: string | null
          created_at: string | null
          cycle_date: string | null
          cycle_id: string | null
          cycle_number: number | null
          cycle_status: string | null
          fund_name: string | null
          id: string | null
          installment_per_member: number | null
          member_address: string | null
          member_id: string | null
          member_name: string | null
          member_phone: string | null
          notes: string | null
          payment_method: string | null
          payout_amount: number | null
          payout_date: string | null
          payout_id: string | null
          payout_method: string | null
          payout_receipt_number: string | null
          payout_status: string | null
          payout_winner_name: string | null
          processed_by: string | null
          processed_by_name: string | null
          receipt_number: string | null
          reference_number: string | null
          running_balance: number | null
          status: string | null
          transaction_date: string | null
          transaction_description: string | null
          transaction_time: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_closing_session_id_fkey"
            columns: ["closing_session_id"]
            isOneToOne: false
            referencedRelation: "closing_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["current_cycle_id"]
          },
          {
            foreignKeyName: "cashbook_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chit_funds_with_dynamic_totals: {
        Row: {
          available_slots: number | null
          created_at: string | null
          created_by: string | null
          current_fund_value: number | null
          current_members: number | null
          current_monthly_collection: number | null
          duration_months: number | null
          id: string | null
          installment_per_member: number | null
          max_members: number | null
          name: string | null
          start_date: string | null
          status: string | null
          subscription_percentage: number | null
          total_amount: number | null
          updated_at: string | null
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
      daily_cashbook_summary: {
        Row: {
          cancelled_transactions: number | null
          cash_in_advance: number | null
          cash_in_cash: number | null
          cash_in_transactions: number | null
          cash_in_transfer: number | null
          cash_out_transactions: number | null
          confirmed_transactions: number | null
          net_cash_flow: number | null
          pending_transactions: number | null
          total_amount: number | null
          total_cash_in: number | null
          total_cash_out: number | null
          total_transactions: number | null
          transaction_date: string | null
        }
        Relationships: []
      }
      fund_member_details_view: {
        Row: {
          address: string | null
          advance_balance: number | null
          arrears_amount: number | null
          assigned_collector_id: string | null
          assigned_collector_name: string | null
          balance_last_payment_date: string | null
          chit_fund_id: string | null
          completed_payments: number | null
          duration_months: number | null
          full_name: string | null
          fund_name: string | null
          id: string | null
          installment_per_member: number | null
          last_payment_amount: number | null
          last_payment_date: string | null
          member_since: string | null
          membership_status: string | null
          next_due_amount: number | null
          payment_completion_percentage: number | null
          payment_status: string | null
          pending_payments: number | null
          phone: string | null
          preferred_payment_method: string | null
          remaining_amount: number | null
          total_due_amount: number | null
          total_paid: number | null
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
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "chit_fund_members_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_fund_members_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chit_fund_members_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["id"]
          },
        ]
      }
      hierarchical_master_data_view: {
        Row: {
          active_member_count: number | null
          collection_progress_percentage: number | null
          completed_collections: number | null
          completed_cycles: number | null
          created_at: string | null
          current_cycle_date: string | null
          current_cycle_id: string | null
          current_cycle_number: number | null
          current_winner_name: string | null
          cycle_completion_percentage: number | null
          duration_months: number | null
          id: string | null
          installment_per_member: number | null
          last_collection_date: string | null
          max_members: number | null
          member_count: number | null
          members_in_arrears: number | null
          members_with_advances: number | null
          name: string | null
          next_cycle_date: string | null
          pending_collections: number | null
          pending_payouts: number | null
          recent_activity: string | null
          remaining_amount: number | null
          start_date: string | null
          status: string | null
          total_advances: number | null
          total_arrears: number | null
          total_collected: number | null
          total_cycles: number | null
          total_payouts: number | null
          total_value: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      member_collection_details_view: {
        Row: {
          amount_collected: number | null
          amount_variance: number | null
          approved_at: string | null
          approved_by_name: string | null
          chit_fund_id: string | null
          closing_date: string | null
          closing_session_id: string | null
          closing_session_reference: string | null
          closing_status: string | null
          collection_date: string | null
          collection_notes: string | null
          collection_time: string | null
          collector_id: string | null
          collector_name: string | null
          cycle_date: string | null
          cycle_id: string | null
          cycle_number: number | null
          cycle_status: string | null
          display_status: string | null
          entry_created_at: string | null
          entry_updated_at: string | null
          expected_amount: number | null
          fund_name: string | null
          id: string | null
          member_id: string | null
          member_name: string | null
          member_phone: string | null
          payment_method: string | null
          payment_type: string | null
          processing_time_minutes: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "cash_position_summary"
            referencedColumns: ["chit_fund_id"]
          },
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds_with_dynamic_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
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
            foreignKeyName: "collection_entries_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "hierarchical_master_data_view"
            referencedColumns: ["current_cycle_id"]
          },
          {
            foreignKeyName: "collection_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "fund_member_details_view"
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
      monthly_cashbook_summary: {
        Row: {
          active_collectors: number | null
          active_funds: number | null
          avg_cash_in_amount: number | null
          avg_cash_out_amount: number | null
          cash_in_transactions: number | null
          cash_out_transactions: number | null
          month: number | null
          month_date: string | null
          month_name: string | null
          net_cash_flow: number | null
          total_amount: number | null
          total_cash_in: number | null
          total_cash_out: number | null
          total_transactions: number | null
          unique_members: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_advance_to_cycle: {
        Args: {
          p_amount_to_apply: number
          p_chit_fund_id: string
          p_cycle_id: string
          p_member_id: string
        }
        Returns: boolean
      }
      auto_apply_advance_to_next_cycle: {
        Args: {
          p_amount_to_apply?: number
          p_chit_fund_id: string
          p_member_id: string
        }
        Returns: {
          amount_applied: number
          cycles_paid: number
          next_cycle_id: string
          next_cycle_number: number
          remaining_advance: number
        }[]
      }
      calculate_cycle_payout_amount: {
        Args: { p_commission_percentage?: number; p_cycle_id: string }
        Returns: {
          commission_amount: number
          net_payout_amount: number
          participating_members: number
          total_collected: number
        }[]
      }
      calculate_member_balance: {
        Args: { p_chit_fund_id: string; p_member_id: string }
        Returns: {
          advance_balance: number
          arrears_amount: number
          last_payment_date: string
          total_due: number
          total_paid: number
        }[]
      }
      calculate_running_balance: {
        Args: {
          exclude_id?: string
          fund_id: string
          transaction_dt: string
          transaction_tm: string
        }
        Returns: number
      }
      can_add_member_to_chit_fund: {
        Args: { p_chit_fund_id: string; p_member_id?: string }
        Returns: {
          can_add: boolean
          current_members: number
          max_members: number
          reason: string
        }[]
      }
      can_pay_with_advance: {
        Args: {
          p_chit_fund_id: string
          p_member_id: string
          p_required_amount: number
        }
        Returns: {
          can_pay: boolean
          current_advance: number
          remaining_after_payment: number
        }[]
      }
      check_duplicate_collection: {
        Args: { p_cycle_id: string; p_member_id: string }
        Returns: {
          existing_amount: number
          existing_date: string
          existing_status: string
          has_duplicate: boolean
        }[]
      }
      check_duplicate_member_name: {
        Args: { member_name: string }
        Returns: boolean
      }
      generate_receipt_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_chit_funds_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_slots: number
          created_at: string
          current_fund_value: number
          current_members: number
          current_monthly_collection: number
          duration_months: number
          total_cycles: number
          id: string
          installment_per_member: number
          max_members: number
          name: string
          start_date: string
          status: string
          subscription_percentage: number
        }[]
      }
      get_arrears_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_arrears: number
          minor_cases: number
          moderate_cases: number
          severe_cases: number
          total_arrears_amount: number
          total_members_with_arrears: number
        }[]
      }
      get_chit_fund_dynamic_stats: {
        Args: { p_chit_fund_id: string }
        Returns: {
          available_slots: number
          can_add_members: boolean
          chit_fund_id: string
          current_fund_value: number
          current_members: number
          current_monthly_collection: number
          installment_per_member: number
          max_members: number
          subscription_percentage: number
        }[]
      }
      get_cycle_collection_summary: {
        Args: { p_cycle_id: string }
        Returns: {
          collection_percentage: number
          cycle_id: string
          expected_amount: number
          members_paid: number
          total_collected: number
          total_members: number
        }[]
      }
      get_cycle_payment_status: {
        Args: { p_cycle_id: string; p_member_id: string }
        Returns: {
          amount_paid: number
          cycle_id: string
          installment_amount: number
          is_fully_paid: boolean
          payment_status: string
          remaining_amount: number
        }[]
      }
      get_eligible_winners: {
        Args: { p_chit_fund_id: string }
        Returns: {
          advance_balance: number
          arrears_amount: number
          current_balance_status: string
          member_id: string
          member_name: string
          phone: string
        }[]
      }
      get_max_payable_amount: {
        Args: { p_cycle_id: string; p_member_id: string }
        Returns: number
      }
      get_member_overdue_cycles: {
        Args: { p_chit_fund_id: string; p_member_id: string }
        Returns: {
          cycle_date: string
          cycle_id: string
          cycle_number: number
          days_overdue: number
          has_payment: boolean
          installment_amount: number
        }[]
      }
      get_member_payment_history: {
        Args: { p_chit_fund_id: string; p_member_id: string }
        Returns: {
          amount_paid: number
          cycle_date: string
          cycle_number: number
          payment_date: string
          payment_method: string
          status: string
        }[]
      }
      get_members_with_advances: {
        Args: { p_chit_fund_id?: string }
        Returns: {
          advance_balance: number
          chit_fund_id: string
          chit_fund_name: string
          cycles_prepaid: number
          installment_per_member: number
          member_id: string
          member_name: string
          phone: string
        }[]
      }
      get_members_with_arrears: {
        Args: Record<PropertyKey, never>
        Returns: {
          advance_balance: number
          arrears_amount: number
          chit_fund_id: string
          chit_fund_name: string
          days_overdue: number
          installment_per_member: number
          last_payment_date: string
          member_id: string
          member_name: string
          overdue_cycles: number
          phone: string
        }[]
      }
      get_next_payable_cycle: {
        Args: {
          p_chit_fund_id: string
          p_current_cycle_id?: string
          p_member_id: string
        }
        Returns: {
          cycle_date: string
          cycle_id: string
          cycle_number: number
          payment_status: string
          remaining_amount: number
        }[]
      }
      get_similar_member_names: {
        Args: { member_name: string }
        Returns: {
          existing_name: string
          id: string
        }[]
      }
      get_system_admin_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      process_advance_payment: {
        Args: {
          p_chit_fund_id: string
          p_installment_amount: number
          p_member_id: string
          p_payment_amount: number
        }
        Returns: {
          advance_applied: number
          cycles_auto_paid: number
          new_advance_balance: number
        }[]
      }
      process_aggregated_advance_payment: {
        Args: {
          p_chit_fund_id: string
          p_cycle_id: string
          p_member_id: string
        }
        Returns: undefined
      }
      recalculate_all_cashbook_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_all_member_balances: {
        Args: { p_chit_fund_id: string }
        Returns: number
      }
      update_all_member_balances_system_wide: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      validate_payment_attempt: {
        Args: {
          p_cycle_id: string
          p_member_id: string
          p_payment_amount: number
        }
        Returns: {
          current_paid: number
          error_message: string
          installment_amount: number
          is_valid: boolean
          max_payable: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// Chit Fund Types
export type ChitFund = Tables<'chit_funds'>
export type ChitFundInsert = TablesInsert<'chit_funds'>
export type ChitFundUpdate = TablesUpdate<'chit_funds'>

// Member Types
export type Member = Tables<'members'>
export type MemberInsert = TablesInsert<'members'>
export type MemberUpdate = TablesUpdate<'members'>

// Profile Types
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

// Chit Fund Member Types
export type ChitFundMember = Tables<'chit_fund_members'>
export type ChitFundMemberInsert = TablesInsert<'chit_fund_members'>
export type ChitFundMemberUpdate = TablesUpdate<'chit_fund_members'>

// Cycle Types
export type Cycle = Tables<'cycles'>
export type CycleInsert = TablesInsert<'cycles'>
export type CycleUpdate = TablesUpdate<'cycles'>

// Collection Entry Types
export type CollectionEntry = Tables<'collection_entries'>
export type CollectionEntryInsert = TablesInsert<'collection_entries'>
export type CollectionEntryUpdate = TablesUpdate<'collection_entries'>

// Closing Session Types
export type ClosingSession = Tables<'closing_sessions'>
export type ClosingSessionInsert = TablesInsert<'closing_sessions'>
export type ClosingSessionUpdate = TablesUpdate<'closing_sessions'>

// Member Balance Types
export type MemberBalance = Tables<'member_balances'>
export type MemberBalanceInsert = TablesInsert<'member_balances'>
export type MemberBalanceUpdate = TablesUpdate<'member_balances'>

// Payout Types
export type Payout = Tables<'payouts'>
export type PayoutInsert = TablesInsert<'payouts'>
export type PayoutUpdate = TablesUpdate<'payouts'>

// Cashbook Types
export type Cashbook = Tables<'cashbook'>
export type CashbookInsert = TablesInsert<'cashbook'>
export type CashbookUpdate = TablesUpdate<'cashbook'>

// View Types
export type ChitFundWithDynamicTotals = Tables<'chit_funds_with_dynamic_totals'>
export type FundMemberDetailsView = Tables<'fund_member_details_view'>
export type MemberCollectionDetailsView = Tables<'member_collection_details_view'>
export type CashPositionSummary = Tables<'cash_position_summary'>
export type DailyCashbookSummary = Tables<'daily_cashbook_summary'>
export type MonthlyCashbookSummary = Tables<'monthly_cashbook_summary'>
export type CashbookConsolidatedView = Tables<'cashbook_consolidated_view'>
export type HierarchicalMasterDataView = Tables<'hierarchical_master_data_view'>

// Custom types for form validation and components
export type CycleIntervalType = 'weekly' | 'monthly' | 'custom_days'

// Cycle utils types
export interface CycleGenerationOptions {
  startDate: string
  totalCycles: number
  intervalType: CycleIntervalType
  intervalValue: number
}

export interface CycleValidationResult {
  isValid: boolean
  error?: string
}

// Status enums (manually defined based on application logic)
export type ChitFundStatus = 'planning' | 'active' | 'completed' | 'cancelled'
export type MembershipStatus = 'active' | 'inactive' | 'suspended'
export type CollectionStatus = 'pending' | 'closed' | 'cancelled'
export type ClosingSessionStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type CycleStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'
export type PayoutStatus = 'pending' | 'approved' | 'completed' | 'cancelled'
export type TransactionType = 'collection' | 'payout' | 'fee' | 'adjustment'
export type PaymentMethod = 'cash' | 'transfer' | 'upi' | 'cheque'

// Complex query result types
export interface ChitFundStats {
  id: string
  name: string
  current_members: number
  max_members: number | null
  current_fund_value: number
  subscription_percentage: number | null
  available_slots: number | null
  status: ChitFundStatus
}

export interface MemberPaymentHistory {
  cycle_number: number
  cycle_date: string
  amount_paid: number
  payment_date: string
  payment_method: PaymentMethod
  status: CollectionStatus
}

export interface ArrearsInfo {
  member_id: string
  member_name: string
  phone: string | null
  chit_fund_id: string
  chit_fund_name: string
  arrears_amount: number
  days_overdue: number
  overdue_cycles: number
  last_payment_date: string | null
  installment_per_member: number
}

export interface AdvanceInfo {
  member_id: string
  member_name: string
  phone: string | null
  chit_fund_id: string
  chit_fund_name: string
  advance_balance: number
  cycles_prepaid: number
  installment_per_member: number
}

export interface PayoutCalculation {
  total_collected: number
  commission_amount: number
  net_payout_amount: number
  participating_members: number
}

export interface EligibleWinner {
  member_id: string
  member_name: string
  phone: string | null
  current_balance_status: string
  advance_balance: number
  arrears_amount: number
}
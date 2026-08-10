export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          assinante: boolean
          created_at: string
          id: string
          nome: string
          plano: string | null
          role: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          mp_payer_id: string | null
          mp_payment_id: string | null
          updated_at: string
          objetivo: string | null
          disponibilidade: string | null
          posicao: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          affiliate_code: string | null
          referred_by: string | null
          reminder_hour: number | null
          telegram_joined: boolean | null
        }
        Insert: {
          assinante?: boolean
          created_at?: string
          id: string
          nome?: string
          plano?: string | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          mp_payer_id?: string | null
          mp_payment_id?: string | null
          updated_at?: string
          objetivo?: string | null
          disponibilidade?: string | null
          posicao?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          affiliate_code?: string | null
          referred_by?: string | null
          reminder_hour?: number | null
          telegram_joined?: boolean | null
        }
        Update: {
          assinante?: boolean
          created_at?: string
          id?: string
          nome?: string
          plano?: string | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          mp_payer_id?: string | null
          mp_payment_id?: string | null
          updated_at?: string
          objetivo?: string | null
          disponibilidade?: string | null
          posicao?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          affiliate_code?: string | null
          referred_by?: string | null
          reminder_hour?: number | null
          telegram_joined?: boolean | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          id: string
          user_id: string | null
          stripe_event_id: string | null
          event_type: string
          plano: string | null
          payload: Json | null
          created_at: string
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          affiliate_ref: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          stripe_event_id?: string | null
          event_type: string
          plano?: string | null
          payload?: Json | null
          created_at?: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          affiliate_ref?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          stripe_event_id?: string | null
          event_type?: string
          plano?: string | null
          payload?: Json | null
          created_at?: string
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          affiliate_ref?: string | null
        }
        Relationships: []
      }
      sessoes: {
        Row: {
          created_at: string
          data: string
          id: string
          minutos: number
          plano_key: string | null
          treino_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          minutos?: number
          plano_key?: string | null
          treino_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          minutos?: number
          plano_key?: string | null
          treino_id?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_scores: {
        Row: {
          id: string
          user_id: string
          week_start: string
          explosao: number
          controle: number
          resistencia: number
          jogou: boolean
          nota: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          explosao: number
          controle: number
          resistencia: number
          jogou?: boolean
          nota?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          explosao?: number
          controle?: number
          resistencia?: number
          jogou?: boolean
          nota?: string | null
          created_at?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          id: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          created_at?: string
        }
        Relationships: []
      }
      league_entries: {
        Row: {
          id: string
          user_id: string
          week_start: string
          treinos: number
          minutos: number
          streak_peak: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          treinos?: number
          minutos?: number
          streak_peak?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          treinos?: number
          minutos?: number
          streak_peak?: number
          updated_at?: string
        }
        Relationships: []
      }
      escolinha_leads: {
        Row: {
          id: string
          nome: string
          email: string
          telefone: string | null
          escolinha: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          telefone?: string | null
          escolinha?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string | null
          escolinha?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"]

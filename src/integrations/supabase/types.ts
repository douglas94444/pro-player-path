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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          code: string
          created_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          affiliate_code: string | null
          code: string
          created_at: string
          discount_percent: number
          max_redemptions: number | null
          redemptions: number
        }
        Insert: {
          active?: boolean
          affiliate_code?: string | null
          code: string
          created_at?: string
          discount_percent: number
          max_redemptions?: number | null
          redemptions?: number
        }
        Update: {
          active?: boolean
          affiliate_code?: string | null
          code?: string
          created_at?: string
          discount_percent?: number
          max_redemptions?: number | null
          redemptions?: number
        }
        Relationships: []
      }
      escolinha_leads: {
        Row: {
          created_at: string
          email: string
          escolinha: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          escolinha?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          escolinha?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      league_entries: {
        Row: {
          id: string
          minutos: number
          streak_peak: number
          treinos: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          id?: string
          minutos?: number
          streak_peak?: number
          treinos?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          id?: string
          minutos?: number
          streak_peak?: number
          treinos?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          affiliate_ref: string | null
          coupon_code: string | null
          created_at: string
          discount_percent: number | null
          event_type: string
          id: string
          payload: Json | null
          plano: string | null
          stripe_event_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_ref?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number | null
          event_type: string
          id?: string
          payload?: Json | null
          plano?: string | null
          stripe_event_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_ref?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number | null
          event_type?: string
          id?: string
          payload?: Json | null
          plano?: string | null
          stripe_event_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          affiliate_code: string | null
          assinante: boolean
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          disponibilidade: string | null
          id: string
          mp_payer_id: string | null
          mp_payment_id: string | null
          nome: string
          objetivo: string | null
          pause_reason: string | null
          paused_until: string | null
          plano: string | null
          posicao: string | null
          referred_by: string | null
          reminder_hour: number | null
          role: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          telegram_joined: boolean | null
          updated_at: string
        }
        Insert: {
          affiliate_code?: string | null
          assinante?: boolean
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          disponibilidade?: string | null
          id: string
          mp_payer_id?: string | null
          mp_payment_id?: string | null
          nome?: string
          objetivo?: string | null
          pause_reason?: string | null
          paused_until?: string | null
          plano?: string | null
          posicao?: string | null
          referred_by?: string | null
          reminder_hour?: number | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telegram_joined?: boolean | null
          updated_at?: string
        }
        Update: {
          affiliate_code?: string | null
          assinante?: boolean
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          disponibilidade?: string | null
          id?: string
          mp_payer_id?: string | null
          mp_payment_id?: string | null
          nome?: string
          objetivo?: string | null
          pause_reason?: string | null
          paused_until?: string | null
          plano?: string | null
          posicao?: string | null
          referred_by?: string | null
          reminder_hour?: number | null
          role?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telegram_joined?: boolean | null
          updated_at?: string
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
      sugestoes: {
        Row: {
          created_at: string
          email: string
          id: string
          mensagem: string
          nome: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          tipo?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      treino_videos: {
        Row: {
          created_at: string
          exercicio_nome: string | null
          id: string
          storage_path: string | null
          tipo: string
          titulo: string | null
          treino_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          exercicio_nome?: string | null
          id?: string
          storage_path?: string | null
          tipo?: string
          titulo?: string | null
          treino_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          exercicio_nome?: string | null
          id?: string
          storage_path?: string | null
          tipo?: string
          titulo?: string | null
          treino_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      weekly_scores: {
        Row: {
          controle: number
          created_at: string
          explosao: number
          id: string
          jogou: boolean
          nota: string | null
          resistencia: number
          user_id: string
          week_start: string
        }
        Insert: {
          controle: number
          created_at?: string
          explosao: number
          id?: string
          jogou?: boolean
          nota?: string | null
          resistencia: number
          user_id: string
          week_start: string
        }
        Update: {
          controle?: number
          created_at?: string
          explosao?: number
          id?: string
          jogou?: boolean
          nota?: string | null
          resistencia?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      ranking_semanal: {
        Row: {
          minutos: number | null
          nome: string | null
          posicao: number | null
          streak_peak: number | null
          treinos: number | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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

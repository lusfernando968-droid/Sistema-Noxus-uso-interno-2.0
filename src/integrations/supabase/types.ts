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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          hora: string
          id: string
          projeto_id: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao?: string | null
          hora: string
          id?: string
          projeto_id: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          hora?: string
          id?: string
          projeto_id?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          documento: string | null
          email: string
          endereco: string | null
          id: string
          indicado_por: string | null
          nome: string
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documento?: string | null
          email: string
          endereco?: string | null
          id?: string
          indicado_por?: string | null
          nome: string
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documento?: string | null
          email?: string
          endereco?: string | null
          id?: string
          indicado_por?: string | null
          nome?: string
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cidades: {
        Row: {
          id: string
          user_id: string
          nome: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clientes_cidades: {
        Row: {
          id: string
          user_id: string
          cliente_id: string
          cidade_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cliente_id: string
          cidade_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cliente_id?: string
          cidade_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_cidades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_cidades_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          color_theme: string | null
          id: string
          nome_completo: string
          username: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          color_theme?: string | null
          id: string
          nome_completo: string
          username?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          color_theme?: string | null
          id?: string
          nome_completo?: string
          username?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projeto_anexos: {
        Row: {
          created_at: string
          id: string
          nome: string
          projeto_id: string
          tamanho: number | null
          tipo: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          projeto_id: string
          tamanho?: number | null
          tipo: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          projeto_id?: string
          tamanho?: number | null
          tipo?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      projeto_referencias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          projeto_id: string
          titulo: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          projeto_id: string
          titulo: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          projeto_id?: string
          titulo?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string | null
          id: string
          notas: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          notas?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          notas?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_tattoo: {
        Row: {
          agendamento_id: string | null
          categoria: string
          conta_id: string | null
          created_at: string
          data_liquidacao: string | null
          data_vencimento: string
          descricao: string
          id: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          categoria: string
          conta_id?: string | null
          created_at?: string
          data_liquidacao?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          categoria?: string
          conta_id?: string | null
          created_at?: string
          data_liquidacao?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_transacoes_agendamento"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transacoes_conta"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_geral: {
        Row: {
          id: string
          user_id: string
          data: string
          descricao: string
          valor: number
          categoria: string
          forma_pagamento: string
          comprovante: string | null
          observacoes: string | null
          tipo: "entrada" | "saida"
          origem: string | null
          origem_id: string | null
          setor: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data: string
          descricao: string
          valor: number
          categoria: string
          forma_pagamento: string
          comprovante?: string | null
          observacoes?: string | null
          tipo: "entrada" | "saida"
          origem?: string | null
          origem_id?: string | null
          setor?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: string
          descricao?: string
          valor?: number
          categoria?: string
          forma_pagamento?: string
          comprovante?: string | null
          observacoes?: string | null
          tipo?: "entrada" | "saida"
          origem?: string | null
          origem_id?: string | null
          setor?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
    Enums: {
      app_role: ["admin", "manager", "user"],
    },
  },
} as const

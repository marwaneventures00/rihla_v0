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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_plan_items: {
        Row: {
          action_text: string
          completed: boolean
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_text: string
          completed?: boolean
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_text?: string
          completed?: boolean
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      case_sessions: {
        Row: {
          answer_text: string | null
          case_json: Json
          completed_at: string | null
          created_at: string
          difficulty: string | null
          id: string
          score_json: Json | null
          sector: string | null
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          case_json: Json
          completed_at?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          score_json?: Json | null
          sector?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string | null
          case_json?: Json
          completed_at?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          score_json?: Json | null
          sector?: string | null
          user_id?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          answers_json: Json | null
          completed_at: string | null
          created_at: string
          feedback_json: Json | null
          id: string
          interview_type: string | null
          language: string | null
          questions_json: Json
          role: string
          user_id: string
        }
        Insert: {
          answers_json?: Json | null
          completed_at?: string | null
          created_at?: string
          feedback_json?: Json | null
          id?: string
          interview_type?: string | null
          language?: string | null
          questions_json: Json
          role: string
          user_id: string
        }
        Update: {
          answers_json?: Json | null
          completed_at?: string | null
          created_at?: string
          feedback_json?: Json | null
          id?: string
          interview_type?: string | null
          language?: string | null
          questions_json?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      meet_connections: {
        Row: {
          alumni_id: string
          created_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          alumni_id: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          alumni_id?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          ambition_level: number | null
          created_at: string
          geography: string | null
          id: string
          personality_scores: Json
          preferred_sectors: string[]
          user_id: string
          work_environment: string | null
        }
        Insert: {
          ambition_level?: number | null
          created_at?: string
          geography?: string | null
          id?: string
          personality_scores?: Json
          preferred_sectors?: string[]
          user_id: string
          work_environment?: string | null
        }
        Update: {
          ambition_level?: number | null
          created_at?: string
          geography?: string | null
          id?: string
          personality_scores?: Json
          preferred_sectors?: string[]
          user_id?: string
          work_environment?: string | null
        }
        Relationships: []
      }
      pathway_results: {
        Row: {
          created_at: string
          id: string
          result_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          result_json: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          result_json?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          current_role: string | null
          field_of_study: string | null
          full_name: string | null
          id: string
          institution_name: string | null
          institution_type: string | null
          is_alumni: boolean
          onboarding_completed: boolean
          study_level: string | null
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          current_role?: string | null
          field_of_study?: string | null
          full_name?: string | null
          id?: string
          institution_name?: string | null
          institution_type?: string | null
          is_alumni?: boolean
          onboarding_completed?: boolean
          study_level?: string | null
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          current_role?: string | null
          field_of_study?: string | null
          full_name?: string | null
          id?: string
          institution_name?: string | null
          institution_type?: string | null
          is_alumni?: boolean
          onboarding_completed?: boolean
          study_level?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          access_code: string
          admin_email: string | null
          created_at: string
          id: string
          license_active: boolean
          name: string
          student_count: number
        }
        Insert: {
          access_code: string
          admin_email?: string | null
          created_at?: string
          id?: string
          license_active?: boolean
          name: string
          student_count?: number
        }
        Update: {
          access_code?: string
          admin_email?: string | null
          created_at?: string
          id?: string
          license_active?: boolean
          name?: string
          student_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          university_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          university_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          university_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_university: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin"
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
      app_role: ["student", "admin"],
    },
  },
} as const

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
          action_text: string | null
          completed: boolean | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_text?: string | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_text?: string | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      case_sessions: {
        Row: {
          case_json: Json | null
          completed_at: string | null
          difficulty: string | null
          id: string
          score_json: Json | null
          sector: string | null
          user_id: string
        }
        Insert: {
          case_json?: Json | null
          completed_at?: string | null
          difficulty?: string | null
          id?: string
          score_json?: Json | null
          sector?: string | null
          user_id: string
        }
        Update: {
          case_json?: Json | null
          completed_at?: string | null
          difficulty?: string | null
          id?: string
          score_json?: Json | null
          sector?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_sessions: {
        Row: {
          created_at: string | null
          dimensions_covered: Json | null
          id: string
          messages: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dimensions_covered?: Json | null
          id?: string
          messages?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dimensions_covered?: Json | null
          id?: string
          messages?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      graduate_profiles: {
        Row: {
          created_at: string | null
          current_company: string | null
          current_salary_range: string | null
          current_sector: string | null
          current_status: string | null
          field_of_study: string | null
          graduation_year: number | null
          id: string
          job_role: string | null
          last_updated: string | null
          linkedin_url: string | null
          location: string | null
          student_name: string
          time_to_first_job_months: number | null
          university_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_company?: string | null
          current_salary_range?: string | null
          current_sector?: string | null
          current_status?: string | null
          field_of_study?: string | null
          graduation_year?: number | null
          id?: string
          job_role?: string | null
          last_updated?: string | null
          linkedin_url?: string | null
          location?: string | null
          student_name: string
          time_to_first_job_months?: number | null
          university_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_company?: string | null
          current_salary_range?: string | null
          current_sector?: string | null
          current_status?: string | null
          field_of_study?: string | null
          graduation_year?: number | null
          id?: string
          job_role?: string | null
          last_updated?: string | null
          linkedin_url?: string | null
          location?: string | null
          student_name?: string
          time_to_first_job_months?: number | null
          university_id?: string | null
        }
        Relationships: []
      }
      interview_insights: {
        Row: {
          generated_at: string | null
          id: string
          insight_json: Json | null
          user_id: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          insight_json?: Json | null
          user_id: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          insight_json?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      interview_rounds: {
        Row: {
          application_id: string
          created_at: string | null
          duration_minutes: number | null
          feedback_received: string | null
          format: string | null
          id: string
          interview_date: string | null
          interviewer_name: string | null
          my_performance: number | null
          next_steps: string | null
          questions_asked: string | null
          round_number: number | null
          round_type: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback_received?: string | null
          format?: string | null
          id?: string
          interview_date?: string | null
          interviewer_name?: string | null
          my_performance?: number | null
          next_steps?: string | null
          questions_asked?: string | null
          round_number?: number | null
          round_type?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback_received?: string | null
          format?: string | null
          id?: string
          interview_date?: string | null
          interviewer_name?: string | null
          my_performance?: number | null
          next_steps?: string | null
          questions_asked?: string | null
          round_number?: number | null
          round_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_rounds_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          answers_json: Json | null
          completed_at: string | null
          feedback_json: Json | null
          id: string
          job_role: string | null
          questions_json: Json | null
          user_id: string
        }
        Insert: {
          answers_json?: Json | null
          completed_at?: string | null
          feedback_json?: Json | null
          id?: string
          job_role?: string | null
          questions_json?: Json | null
          user_id: string
        }
        Update: {
          answers_json?: Json | null
          completed_at?: string | null
          feedback_json?: Json | null
          id?: string
          job_role?: string | null
          questions_json?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          ai_insight: string | null
          application_date: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          fit_data: Json | null
          fit_score: number | null
          id: string
          job_url: string | null
          location: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          role_title: string
          salary_range: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_insight?: string | null
          application_date?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          fit_data?: Json | null
          fit_score?: number | null
          id?: string
          job_url?: string | null
          location?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          role_title: string
          salary_range?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_insight?: string | null
          application_date?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          fit_data?: Json | null
          fit_score?: number | null
          id?: string
          job_url?: string | null
          location?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          role_title?: string
          salary_range?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      observatoire_surveys: {
        Row: {
          advice_for_students: string | null
          biggest_challenge: string | null
          created_at: string | null
          employed: boolean | null
          graduate_id: string
          id: string
          key_skills_used: string[] | null
          role_matches_degree: boolean | null
          satisfaction_score: number | null
          survey_date: string | null
          would_recommend_university: boolean | null
        }
        Insert: {
          advice_for_students?: string | null
          biggest_challenge?: string | null
          created_at?: string | null
          employed?: boolean | null
          graduate_id: string
          id?: string
          key_skills_used?: string[] | null
          role_matches_degree?: boolean | null
          satisfaction_score?: number | null
          survey_date?: string | null
          would_recommend_university?: boolean | null
        }
        Update: {
          advice_for_students?: string | null
          biggest_challenge?: string | null
          created_at?: string | null
          employed?: boolean | null
          graduate_id?: string
          id?: string
          key_skills_used?: string[] | null
          role_matches_degree?: boolean | null
          satisfaction_score?: number | null
          survey_date?: string | null
          would_recommend_university?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "observatoire_surveys_graduate_id_fkey"
            columns: ["graduate_id"]
            isOneToOne: false
            referencedRelation: "graduate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_responses: {
        Row: {
          ambition_level: number | null
          created_at: string | null
          geography: string | null
          id: string
          personality_scores: Json | null
          preferred_sectors: string[] | null
          user_id: string
          work_environment: string | null
        }
        Insert: {
          ambition_level?: number | null
          created_at?: string | null
          geography?: string | null
          id?: string
          personality_scores?: Json | null
          preferred_sectors?: string[] | null
          user_id: string
          work_environment?: string | null
        }
        Update: {
          ambition_level?: number | null
          created_at?: string | null
          geography?: string | null
          id?: string
          personality_scores?: Json | null
          preferred_sectors?: string[] | null
          user_id?: string
          work_environment?: string | null
        }
        Relationships: []
      }
      pathway_results: {
        Row: {
          all_careers: Json | null
          archetypes: Json | null
          confidence_score: number | null
          created_at: string | null
          id: string
          key_insights: Json | null
          recommended_track: string | null
          result_json: Json | null
          user_id: string
        }
        Insert: {
          all_careers?: Json | null
          archetypes?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          key_insights?: Json | null
          recommended_track?: string | null
          result_json?: Json | null
          user_id: string
        }
        Update: {
          all_careers?: Json | null
          archetypes?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          key_insights?: Json | null
          recommended_track?: string | null
          result_json?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          field_of_study: string | null
          full_name: string | null
          graduation_year: string | null
          id: string
          institution_name: string | null
          institution_type: string | null
          linkedin_url: string | null
          onboarding_completed: boolean | null
          role: string | null
          school: string | null
          study_level: string | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          field_of_study?: string | null
          full_name?: string | null
          graduation_year?: string | null
          id: string
          institution_name?: string | null
          institution_type?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean | null
          role?: string | null
          school?: string | null
          study_level?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          field_of_study?: string | null
          full_name?: string | null
          graduation_year?: string | null
          id?: string
          institution_name?: string | null
          institution_type?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean | null
          role?: string | null
          school?: string | null
          study_level?: string | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          access_code: string | null
          admin_email: string | null
          created_at: string | null
          id: string
          license_active: boolean | null
          name: string
          student_count: number | null
        }
        Insert: {
          access_code?: string | null
          admin_email?: string | null
          created_at?: string | null
          id?: string
          license_active?: boolean | null
          name: string
          student_count?: number | null
        }
        Update: {
          access_code?: string | null
          admin_email?: string | null
          created_at?: string | null
          id?: string
          license_active?: boolean | null
          name?: string
          student_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_pulses: {
        Row: {
          created_at: string | null
          id: string
          pulse_json: Json | null
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pulse_json?: Json | null
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pulse_json?: Json | null
          user_id?: string
          week_start?: string
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

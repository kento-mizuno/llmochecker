/**
 * Supabaseデータベース型定義
 */
export interface Database {
  public: {
    Tables: {
      diagnoses: {
        Row: {
          id: string
          url: string
          title: string | null
          description: string | null
          overall_score: number
          category: string
          diagnosis_date: string
          metadata: any
          technical_signals: any
          content_analysis: any
          gemini_analysis: any | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          title?: string | null
          description?: string | null
          overall_score: number
          category: string
          diagnosis_date: string
          metadata: any
          technical_signals: any
          content_analysis: any
          gemini_analysis?: any | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          title?: string | null
          description?: string | null
          overall_score?: number
          category?: string
          diagnosis_date?: string
          metadata?: any
          technical_signals?: any
          content_analysis?: any
          gemini_analysis?: any | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          diagnosis_id: string
          criteria_id: string
          score: number
          max_score: number
          status: string
          issues: string[]
          suggestions: string[]
          created_at: string
        }
        Insert: {
          id?: string
          diagnosis_id: string
          criteria_id: string
          score: number
          max_score: number
          status: string
          issues?: string[]
          suggestions?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          diagnosis_id?: string
          criteria_id?: string
          score?: number
          max_score?: number
          status?: string
          issues?: string[]
          suggestions?: string[]
          created_at?: string
        }
      }
      improvements: {
        Row: {
          id: string
          diagnosis_id: string
          category: string
          title: string
          description: string
          implementation: string
          expected_impact: string
          priority: number
          effort: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          diagnosis_id: string
          category: string
          title: string
          description: string
          implementation: string
          expected_impact: string
          priority: number
          effort: string
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          diagnosis_id?: string
          category?: string
          title?: string
          description?: string
          implementation?: string
          expected_impact?: string
          priority?: number
          effort?: string
          display_order?: number
          created_at?: string
        }
      }
      diagnosis_progress: {
        Row: {
          id: string
          url: string
          status: string
          current_step: string
          progress_percentage: number
          estimated_completion: string
          steps_completed: string[]
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          status: string
          current_step: string
          progress_percentage: number
          estimated_completion: string
          steps_completed?: string[]
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          status?: string
          current_step?: string
          progress_percentage?: number
          estimated_completion?: string
          steps_completed?: string[]
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      evaluation_criteria: {
        Row: {
          id: number
          name: string
          category: string
          impact: string
          description: string
          llmo_reason: string
          weight: number
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          category: string
          impact: string
          description: string
          llmo_reason: string
          weight?: number
          display_order: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string
          impact?: string
          description?: string
          llmo_reason?: string
          weight?: number
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}
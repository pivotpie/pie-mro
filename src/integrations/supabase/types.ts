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
      aircraft: {
        Row: {
          aircraft_code: string
          aircraft_name: string
          id: number
        }
        Insert: {
          aircraft_code: string
          aircraft_name: string
          id?: number
        }
        Update: {
          aircraft_code?: string
          aircraft_name?: string
          id?: number
        }
        Relationships: []
      }
      aircraft_authorities: {
        Row: {
          aircraft_id: number | null
          authority_id: number | null
          id: number
        }
        Insert: {
          aircraft_id?: number | null
          authority_id?: number | null
          id?: number
        }
        Update: {
          aircraft_id?: number | null
          authority_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_authorities_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aircraft_authorities_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "authorities"
            referencedColumns: ["id"]
          },
        ]
      }
      authorities: {
        Row: {
          authority_code: string
          authority_name: string
          id: number
        }
        Insert: {
          authority_code: string
          authority_name: string
          id?: number
        }
        Update: {
          authority_code?: string
          authority_name?: string
          id?: number
        }
        Relationships: []
      }
      certification_codes: {
        Row: {
          certification_code: string
          certification_description: string
          id: number
        }
        Insert: {
          certification_code: string
          certification_description: string
          id?: number
        }
        Update: {
          certification_code?: string
          certification_description?: string
          id?: number
        }
        Relationships: []
      }
      certifications: {
        Row: {
          aircraft_id: number | null
          authority_id: number | null
          certification_code_id: number | null
          employee_id: number | null
          engine_type_id: number | null
          expiry_date: string
          id: number
          issued_date: string
          validity_status_id: number | null
        }
        Insert: {
          aircraft_id?: number | null
          authority_id?: number | null
          certification_code_id?: number | null
          employee_id?: number | null
          engine_type_id?: number | null
          expiry_date: string
          id?: number
          issued_date: string
          validity_status_id?: number | null
        }
        Update: {
          aircraft_id?: number | null
          authority_id?: number | null
          certification_code_id?: number | null
          employee_id?: number | null
          engine_type_id?: number | null
          expiry_date?: string
          id?: number
          issued_date?: string
          validity_status_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "authorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_certification_code_id_fkey"
            columns: ["certification_code_id"]
            isOneToOne: false
            referencedRelation: "certification_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_engine_type_id_fkey"
            columns: ["engine_type_id"]
            isOneToOne: false
            referencedRelation: "engine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_validity_status_id_fkey"
            columns: ["validity_status_id"]
            isOneToOne: false
            referencedRelation: "validity_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      core_codes: {
        Row: {
          core_code: string
          id: number
        }
        Insert: {
          core_code: string
          id?: number
        }
        Update: {
          core_code?: string
          id?: number
        }
        Relationships: []
      }
      date_references: {
        Row: {
          actual_date: string
          excel_date_code: number
          id: number
        }
        Insert: {
          actual_date: string
          excel_date_code: number
          id?: number
        }
        Update: {
          actual_date?: string
          excel_date_code?: number
          id?: number
        }
        Relationships: []
      }
      employee_cores: {
        Row: {
          core_id: number | null
          employee_id: number | null
          id: number
        }
        Insert: {
          core_id?: number | null
          employee_id?: number | null
          id?: number
        }
        Update: {
          core_id?: number | null
          employee_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_cores_core_id_fkey"
            columns: ["core_id"]
            isOneToOne: false
            referencedRelation: "core_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_cores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_supports: {
        Row: {
          employee_id: number | null
          id: number
          support_id: number | null
        }
        Insert: {
          employee_id?: number | null
          id?: number
          support_id?: number | null
        }
        Update: {
          employee_id?: number | null
          id?: number
          support_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_supports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_supports_support_id_fkey"
            columns: ["support_id"]
            isOneToOne: false
            referencedRelation: "support_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          e_number: number
          id: number
          job_title_id: number | null
          name: string
          team_id: number | null
        }
        Insert: {
          e_number: number
          id?: number
          job_title_id?: number | null
          name: string
          team_id?: number | null
        }
        Update: {
          e_number?: number
          id?: number
          job_title_id?: number | null
          name?: string
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_types: {
        Row: {
          engine_name: string
          id: number
        }
        Insert: {
          engine_name: string
          id?: number
        }
        Update: {
          engine_name?: string
          id?: number
        }
        Relationships: []
      }
      job_titles: {
        Row: {
          id: number
          job_code: string
          job_description: string
        }
        Insert: {
          id?: number
          job_code: string
          job_description: string
        }
        Update: {
          id?: number
          job_code?: string
          job_description?: string
        }
        Relationships: []
      }
      roster_assignments: {
        Row: {
          date_id: number | null
          employee_id: number | null
          id: number
          roster_id: number | null
        }
        Insert: {
          date_id?: number | null
          employee_id?: number | null
          id?: number
          roster_id?: number | null
        }
        Update: {
          date_id?: number | null
          employee_id?: number | null
          id?: number
          roster_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_assignments_date_id_fkey"
            columns: ["date_id"]
            isOneToOne: false
            referencedRelation: "date_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_assignments_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "roster_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_codes: {
        Row: {
          description: string | null
          id: number
          roster_code: string
        }
        Insert: {
          description?: string | null
          id?: number
          roster_code: string
        }
        Update: {
          description?: string | null
          id?: number
          roster_code?: string
        }
        Relationships: []
      }
      support_codes: {
        Row: {
          id: number
          support_code: string
        }
        Insert: {
          id?: number
          support_code: string
        }
        Update: {
          id?: number
          support_code?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: number
          team_name: string
        }
        Insert: {
          id?: number
          team_name: string
        }
        Update: {
          id?: number
          team_name?: string
        }
        Relationships: []
      }
      validity_statuses: {
        Row: {
          id: number
          status: string
        }
        Insert: {
          id?: number
          status: string
        }
        Update: {
          id?: number
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_roster_may_june_2025: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

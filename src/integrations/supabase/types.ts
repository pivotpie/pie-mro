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
          aircraft_type_id: number | null
          customer: string | null
          delivery_date: string | null
          id: number
          manufacturing_date: string | null
          registration: string | null
          serial_number: string | null
          total_cycles: number | null
          total_hours: number | null
        }
        Insert: {
          aircraft_code: string
          aircraft_name: string
          aircraft_type_id?: number | null
          customer?: string | null
          delivery_date?: string | null
          id?: number
          manufacturing_date?: string | null
          registration?: string | null
          serial_number?: string | null
          total_cycles?: number | null
          total_hours?: number | null
        }
        Update: {
          aircraft_code?: string
          aircraft_name?: string
          aircraft_type_id?: number | null
          customer?: string | null
          delivery_date?: string | null
          id?: number
          manufacturing_date?: string | null
          registration?: string | null
          serial_number?: string | null
          total_cycles?: number | null
          total_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_aircraft_type_id_fkey"
            columns: ["aircraft_type_id"]
            isOneToOne: false
            referencedRelation: "aircraft_types"
            referencedColumns: ["id"]
          },
        ]
      }
      aircraft_models: {
        Row: {
          aircraft_type_id: number | null
          description: string | null
          id: number
          model_code: string
          model_name: string
        }
        Insert: {
          aircraft_type_id?: number | null
          description?: string | null
          id?: number
          model_code: string
          model_name: string
        }
        Update: {
          aircraft_type_id?: number | null
          description?: string | null
          id?: number
          model_code?: string
          model_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_models_aircraft_type_id_fkey"
            columns: ["aircraft_type_id"]
            isOneToOne: false
            referencedRelation: "aircraft_types"
            referencedColumns: ["id"]
          },
        ]
      }
      aircraft_types: {
        Row: {
          category: string
          id: number
          manufacturer: string
          type_code: string
          type_name: string
        }
        Insert: {
          category: string
          id?: number
          manufacturer: string
          type_code: string
          type_name: string
        }
        Update: {
          category?: string
          id?: number
          manufacturer?: string
          type_code?: string
          type_name?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          comments: string | null
          date: string
          employee_id: number | null
          id: number
          status: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          comments?: string | null
          date: string
          employee_id?: number | null
          id?: number
          status?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          comments?: string | null
          date?: string
          employee_id?: number | null
          id?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      authorization_types: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
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
      employee_authorizations: {
        Row: {
          aircraft_model_id: number
          authorization_basis: string
          authorization_category: string | null
          authorization_type_id: number
          certificate_number: string | null
          created_at: string | null
          created_by: string | null
          easa_certificate_number: string | null
          easa_issued_flag: boolean | null
          easa_issued_on: string | null
          easa_remarks: string | null
          employee_id: number
          engine_model_id: number | null
          expiry_date: string | null
          faa_certificate_number: string | null
          faa_issued_flag: boolean | null
          faa_issued_on: string | null
          faa_remarks: string | null
          gcaa_certificate_number: string | null
          gcaa_issued_flag: boolean | null
          gcaa_issued_on: string | null
          gcaa_remarks: string | null
          icao_certificate_number: string | null
          icao_issued_flag: boolean | null
          icao_remarks: string | null
          id: number
          is_active: boolean | null
          issued_on: string | null
          kept: boolean | null
          limitation: string | null
          manufacturer_certificate_number: string | null
          manufacturer_issued_flag: boolean | null
          manufacturer_issued_on: string | null
          manufacturer_remarks: string | null
          other_authority_name: string | null
          other_certificate_number: string | null
          other_issued_flag: boolean | null
          other_issued_on: string | null
          other_remarks: string | null
          p7_certificate_number: string | null
          p7_issued_flag: boolean | null
          p7_issued_on: string | null
          p7_remarks: string | null
          pages: number | null
          reissued_on: string | null
          remarks: string | null
          suspended: boolean | null
          suspended_on: string | null
          suspension_reason: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          aircraft_model_id: number
          authorization_basis: string
          authorization_category?: string | null
          authorization_type_id: number
          certificate_number?: string | null
          created_at?: string | null
          created_by?: string | null
          easa_certificate_number?: string | null
          easa_issued_flag?: boolean | null
          easa_issued_on?: string | null
          easa_remarks?: string | null
          employee_id: number
          engine_model_id?: number | null
          expiry_date?: string | null
          faa_certificate_number?: string | null
          faa_issued_flag?: boolean | null
          faa_issued_on?: string | null
          faa_remarks?: string | null
          gcaa_certificate_number?: string | null
          gcaa_issued_flag?: boolean | null
          gcaa_issued_on?: string | null
          gcaa_remarks?: string | null
          icao_certificate_number?: string | null
          icao_issued_flag?: boolean | null
          icao_remarks?: string | null
          id?: number
          is_active?: boolean | null
          issued_on?: string | null
          kept?: boolean | null
          limitation?: string | null
          manufacturer_certificate_number?: string | null
          manufacturer_issued_flag?: boolean | null
          manufacturer_issued_on?: string | null
          manufacturer_remarks?: string | null
          other_authority_name?: string | null
          other_certificate_number?: string | null
          other_issued_flag?: boolean | null
          other_issued_on?: string | null
          other_remarks?: string | null
          p7_certificate_number?: string | null
          p7_issued_flag?: boolean | null
          p7_issued_on?: string | null
          p7_remarks?: string | null
          pages?: number | null
          reissued_on?: string | null
          remarks?: string | null
          suspended?: boolean | null
          suspended_on?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          aircraft_model_id?: number
          authorization_basis?: string
          authorization_category?: string | null
          authorization_type_id?: number
          certificate_number?: string | null
          created_at?: string | null
          created_by?: string | null
          easa_certificate_number?: string | null
          easa_issued_flag?: boolean | null
          easa_issued_on?: string | null
          easa_remarks?: string | null
          employee_id?: number
          engine_model_id?: number | null
          expiry_date?: string | null
          faa_certificate_number?: string | null
          faa_issued_flag?: boolean | null
          faa_issued_on?: string | null
          faa_remarks?: string | null
          gcaa_certificate_number?: string | null
          gcaa_issued_flag?: boolean | null
          gcaa_issued_on?: string | null
          gcaa_remarks?: string | null
          icao_certificate_number?: string | null
          icao_issued_flag?: boolean | null
          icao_remarks?: string | null
          id?: number
          is_active?: boolean | null
          issued_on?: string | null
          kept?: boolean | null
          limitation?: string | null
          manufacturer_certificate_number?: string | null
          manufacturer_issued_flag?: boolean | null
          manufacturer_issued_on?: string | null
          manufacturer_remarks?: string | null
          other_authority_name?: string | null
          other_certificate_number?: string | null
          other_issued_flag?: boolean | null
          other_issued_on?: string | null
          other_remarks?: string | null
          p7_certificate_number?: string | null
          p7_issued_flag?: boolean | null
          p7_issued_on?: string | null
          p7_remarks?: string | null
          pages?: number | null
          reissued_on?: string | null
          remarks?: string | null
          suspended?: boolean | null
          suspended_on?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_authorizations_aircraft_model_id_fkey"
            columns: ["aircraft_model_id"]
            isOneToOne: false
            referencedRelation: "aircraft_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_authorizations_authorization_type_id_fkey"
            columns: ["authorization_type_id"]
            isOneToOne: false
            referencedRelation: "authorization_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_authorizations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_authorizations_engine_model_id_fkey"
            columns: ["engine_model_id"]
            isOneToOne: false
            referencedRelation: "engine_models"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_cores: {
        Row: {
          assignment_date: string | null
          core_id: number | null
          employee_id: number | null
          id: number
        }
        Insert: {
          assignment_date?: string | null
          core_id?: number | null
          employee_id?: number | null
          id?: number
        }
        Update: {
          assignment_date?: string | null
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
          assignment_date: string | null
          employee_id: number | null
          id: number
          support_id: number | null
        }
        Insert: {
          assignment_date?: string | null
          employee_id?: number | null
          id?: number
          support_id?: number | null
        }
        Update: {
          assignment_date?: string | null
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
      employee_training_schedules: {
        Row: {
          attended_date: string | null
          certificate_expiry_date: string | null
          certificate_issue_date: string | null
          employee_id: number | null
          id: number
          remarks: string | null
          required_date: string | null
          status_id: number | null
          training_type_id: number | null
        }
        Insert: {
          attended_date?: string | null
          certificate_expiry_date?: string | null
          certificate_issue_date?: string | null
          employee_id?: number | null
          id?: number
          remarks?: string | null
          required_date?: string | null
          status_id?: number | null
          training_type_id?: number | null
        }
        Update: {
          attended_date?: string | null
          certificate_expiry_date?: string | null
          certificate_issue_date?: string | null
          employee_id?: number | null
          id?: number
          remarks?: string | null
          required_date?: string | null
          status_id?: number | null
          training_type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_schedules_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "training_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_schedules_training_type_id_fkey"
            columns: ["training_type_id"]
            isOneToOne: false
            referencedRelation: "training_types"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          date_of_joining: string | null
          e_number: number
          employee_status: string | null
          fte_date: string | null
          id: number
          is_active: boolean | null
          job_title_id: number | null
          key_name: string | null
          mobile_number: string | null
          name: string
          nationality: string | null
          night_shift_ok: boolean | null
          profit_center: string | null
          team_id: number | null
          user: string | null
        }
        Insert: {
          date_of_joining?: string | null
          e_number: number
          employee_status?: string | null
          fte_date?: string | null
          id?: number
          is_active?: boolean | null
          job_title_id?: number | null
          key_name?: string | null
          mobile_number?: string | null
          name: string
          nationality?: string | null
          night_shift_ok?: boolean | null
          profit_center?: string | null
          team_id?: number | null
          user?: string | null
        }
        Update: {
          date_of_joining?: string | null
          e_number?: number
          employee_status?: string | null
          fte_date?: string | null
          id?: number
          is_active?: boolean | null
          job_title_id?: number | null
          key_name?: string | null
          mobile_number?: string | null
          name?: string
          nationality?: string | null
          night_shift_ok?: boolean | null
          profit_center?: string | null
          team_id?: number | null
          user?: string | null
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
      engine_models: {
        Row: {
          description: string | null
          id: number
          manufacturer: string
          model_code: string
        }
        Insert: {
          description?: string | null
          id?: number
          manufacturer: string
          model_code: string
        }
        Update: {
          description?: string | null
          id?: number
          manufacturer?: string
          model_code?: string
        }
        Relationships: []
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
      hangars: {
        Row: {
          active: boolean | null
          capacity: number
          hangar_code: string
          hangar_name: string
          hangar_type: string | null
          id: number
          location: string | null
        }
        Insert: {
          active?: boolean | null
          capacity: number
          hangar_code: string
          hangar_name: string
          hangar_type?: string | null
          id?: number
          location?: string | null
        }
        Update: {
          active?: boolean | null
          capacity?: number
          hangar_code?: string
          hangar_name?: string
          hangar_type?: string | null
          id?: number
          location?: string | null
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
      maintenance_visits: {
        Row: {
          aircraft_id: number | null
          check_type: string
          created_at: string | null
          date_in: string
          date_out: string
          hangar_id: number | null
          id: number
          remarks: string | null
          status: string | null
          total_hours: number | null
          visit_number: string
        }
        Insert: {
          aircraft_id?: number | null
          check_type: string
          created_at?: string | null
          date_in: string
          date_out: string
          hangar_id?: number | null
          id?: number
          remarks?: string | null
          status?: string | null
          total_hours?: number | null
          visit_number: string
        }
        Update: {
          aircraft_id?: number | null
          check_type?: string
          created_at?: string | null
          date_in?: string
          date_out?: string
          hangar_id?: number | null
          id?: number
          remarks?: string | null
          status?: string | null
          total_hours?: number | null
          visit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_visits_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_visits_hangar_id_fkey"
            columns: ["hangar_id"]
            isOneToOne: false
            referencedRelation: "hangars"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel_requirements: {
        Row: {
          date: string
          day_shift_count: number
          id: number
          maintenance_visit_id: number | null
          night_shift_count: number
          remarks: string | null
          trade_id: number | null
        }
        Insert: {
          date: string
          day_shift_count?: number
          id?: number
          maintenance_visit_id?: number | null
          night_shift_count?: number
          remarks?: string | null
          trade_id?: number | null
        }
        Update: {
          date?: string
          day_shift_count?: number
          id?: number
          maintenance_visit_id?: number | null
          night_shift_count?: number
          remarks?: string | null
          trade_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personnel_requirements_maintenance_visit_id_fkey"
            columns: ["maintenance_visit_id"]
            isOneToOne: false
            referencedRelation: "maintenance_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_requirements_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_centers: {
        Row: {
          code: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: number
          name?: string
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
      trades: {
        Row: {
          description: string | null
          id: number
          skill_category: string | null
          trade_code: string
          trade_name: string
        }
        Insert: {
          description?: string | null
          id?: number
          skill_category?: string | null
          trade_code: string
          trade_name: string
        }
        Update: {
          description?: string | null
          id?: number
          skill_category?: string | null
          trade_code?: string
          trade_name?: string
        }
        Relationships: []
      }
      training_status: {
        Row: {
          code: string
          color: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          color: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          code?: string
          color?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      training_types: {
        Row: {
          code: string
          description: string | null
          frequency_months: number
          id: number
          is_mandatory: boolean | null
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          frequency_months: number
          id?: number
          is_mandatory?: boolean | null
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          frequency_months?: number
          id?: number
          is_mandatory?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          id: number
          password: string | null
          user_name: string | null
        }
        Insert: {
          id?: number
          password?: string | null
          user_name?: string | null
        }
        Update: {
          id?: number
          password?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_user_name_fkey"
            columns: ["user_name"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user"]
          },
        ]
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
      allocate_roster_may_june_2025: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      allocate_roster_may_june_2025_fixed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      allocate_roster_may_june_2025_shuffled: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      allocate_roster_may_june_2025_simple: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      allocate_roster_may_june_2025_weekend_offs: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      analyze_off_day_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          day_name: string
          day_number: number
          total_offs: number
          percentage: number
        }[]
      }
      assign_employees_to_codes_with_dates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      authenticate_user: {
        Args: { p_username: string; p_password: string }
        Returns: {
          id: number
          user_name: string
          authenticated: boolean
        }[]
      }
      clear_aircraft_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_schedule_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_all_personnel_requirements: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_attendance_may_1_to_25_2025: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_employee_authorizations: {
        Args: { p_number_of_records: number }
        Returns: undefined
      }
      generate_hangar_visits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_may_roster_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          "E#": number
          Name: string
          "May-1": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
        }[]
      }
      generate_may_roster_report_shuffled: {
        Args: Record<PropertyKey, never>
        Returns: {
          "E#": number
          Name: string
          "May-1": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
          Pattern_Summary: string
        }[]
      }
      generate_realistic_roster_may_june_2025: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_registration_by_authority: {
        Args: { authority: string }
        Returns: string
      }
      generate_roster_may_june_2025: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_roster_report_sample: {
        Args: Record<PropertyKey, never>
        Returns: {
          "E#": number
          Title: string
          Name: string
          Team: string
          Core: string
          Support: string
          "May-1": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
          "Jun-1": string
          "Jun-2": string
          "Jun-3": string
          "Jun-4": string
          "Jun-5": string
          "Jun-6": string
          "Jun-7": string
          "Jun-8": string
          "Jun-9": string
          "Jun-10": string
          "Jun-11": string
          "Jun-12": string
          "Jun-13": string
          "Jun-14": string
          "Jun-15": string
        }[]
      }
      generate_training_schedules: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_weekend_roster_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          "E#": number
          Name: string
          Off_Pattern: string
          "May-1": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
        }[]
      }
      get_employee_roster: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          employee_id: number
          date: string
          status_code: string
          notes: string
        }[]
      }
      migrate_certifications_to_authorizations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_aircraft_from_schedule: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_aircraft_models: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_aircraft_types: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_assignment_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_authorities_and_validity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_engine_types: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_hangars: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_maintenance_visits_from_schedule: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      populate_personnel_requirements_only: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      setup_aircraft_maintenance_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      show_employee_pattern: {
        Args: { emp_num: number; start_date?: string; days_to_show?: number }
        Returns: {
          date_val: string
          day_name: string
          roster_code: string
          cycle_day: number
          pattern_note: string
        }[]
      }
      test_roster_allocation: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_number: number
          employee_name: string
          roster_date: string
          roster_code: string
          day_of_week: string
        }[]
      }
      update_certifications_with_new_aircraft: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_roster_patterns: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_number: number
          employee_name: string
          issue_date: string
          issue_description: string
        }[]
      }
      validate_roster_patterns_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_number: number
          employee_name: string
          week_start_date: string
          issue_description: string
          pattern_found: string
        }[]
      }
      validate_roster_patterns_fixed: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_number: number
          employee_name: string
          issue_date: string
          issue_description: string
          pattern_found: string
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

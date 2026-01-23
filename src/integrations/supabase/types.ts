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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
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
          frontend_name: string | null
          id: number
          roster_code: string
        }
        Insert: {
          description?: string | null
          frontend_name?: string | null
          id?: number
          roster_code: string
        }
        Update: {
          description?: string | null
          frontend_name?: string | null
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
      temp_cert_import: {
        Row: {
          aircraft_type: string | null
          authority: string | null
          certification_code: string | null
          employee_name: string | null
          engine_type: string | null
          expiry_date: string | null
          issued_date: string | null
          title: string | null
          validity: string | null
        }
        Insert: {
          aircraft_type?: string | null
          authority?: string | null
          certification_code?: string | null
          employee_name?: string | null
          engine_type?: string | null
          expiry_date?: string | null
          issued_date?: string | null
          title?: string | null
          validity?: string | null
        }
        Update: {
          aircraft_type?: string | null
          authority?: string | null
          certification_code?: string | null
          employee_name?: string | null
          engine_type?: string | null
          expiry_date?: string | null
          issued_date?: string | null
          title?: string | null
          validity?: string | null
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
      training_authorities: {
        Row: {
          authority_code: string
          authority_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          authority_code: string
          authority_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          authority_code?: string
          authority_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      training_conflicts: {
        Row: {
          conflict_description: string
          conflict_type: string
          created_at: string | null
          detected_at: string | null
          employee_id: number
          id: number
          resolution_method: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity_level: number | null
          status: string | null
          training_session_id: number
          updated_at: string | null
        }
        Insert: {
          conflict_description: string
          conflict_type: string
          created_at?: string | null
          detected_at?: string | null
          employee_id: number
          id?: number
          resolution_method?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity_level?: number | null
          status?: string | null
          training_session_id: number
          updated_at?: string | null
        }
        Update: {
          conflict_description?: string
          conflict_type?: string
          created_at?: string | null
          detected_at?: string | null
          employee_id?: number
          id?: number
          resolution_method?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity_level?: number | null
          status?: string | null
          training_session_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_conflicts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_conflicts_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_prerequisites: {
        Row: {
          created_at: string | null
          id: number
          is_mandatory: boolean | null
          prerequisite_training_type_id: number
          training_type_id: number
          validity_months: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_mandatory?: boolean | null
          prerequisite_training_type_id: number
          training_type_id: number
          validity_months?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_mandatory?: boolean | null
          prerequisite_training_type_id?: number
          training_type_id?: number
          validity_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_prerequisites_prerequisite_training_type_id_fkey"
            columns: ["prerequisite_training_type_id"]
            isOneToOne: false
            referencedRelation: "training_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_prerequisites_training_type_id_fkey"
            columns: ["training_type_id"]
            isOneToOne: false
            referencedRelation: "training_types"
            referencedColumns: ["id"]
          },
        ]
      }
      training_resources: {
        Row: {
          availability_schedule: Json | null
          capacity: number | null
          created_at: string | null
          id: number
          is_active: boolean | null
          location: string | null
          resource_name: string
          resource_type: string
          updated_at: string | null
        }
        Insert: {
          availability_schedule?: Json | null
          capacity?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          location?: string | null
          resource_name: string
          resource_type: string
          updated_at?: string | null
        }
        Update: {
          availability_schedule?: Json | null
          capacity?: number | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          location?: string | null
          resource_name?: string
          resource_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      training_session_assignments: {
        Row: {
          assigned_by: string | null
          assignment_date: string | null
          assignment_status: string | null
          attendance_status: string | null
          certificate_expiry_date: string | null
          certificate_issue_date: string | null
          certificate_issued: boolean | null
          certificate_number: string | null
          completion_status: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          employee_id: number
          feedback: string | null
          id: number
          score: number | null
          training_session_id: number
          updated_at: string | null
          withdrawal_reason: string | null
        }
        Insert: {
          assigned_by?: string | null
          assignment_date?: string | null
          assignment_status?: string | null
          attendance_status?: string | null
          certificate_expiry_date?: string | null
          certificate_issue_date?: string | null
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_status?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          employee_id: number
          feedback?: string | null
          id?: number
          score?: number | null
          training_session_id: number
          updated_at?: string | null
          withdrawal_reason?: string | null
        }
        Update: {
          assigned_by?: string | null
          assignment_date?: string | null
          assignment_status?: string | null
          attendance_status?: string | null
          certificate_expiry_date?: string | null
          certificate_issue_date?: string | null
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_status?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          employee_id?: number
          feedback?: string | null
          id?: number
          score?: number | null
          training_session_id?: number
          updated_at?: string | null
          withdrawal_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_session_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_assignments_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_session_resources: {
        Row: {
          allocated_at: string | null
          id: number
          quantity_required: number | null
          training_resource_id: number
          training_session_id: number
        }
        Insert: {
          allocated_at?: string | null
          id?: number
          quantity_required?: number | null
          training_resource_id: number
          training_session_id: number
        }
        Update: {
          allocated_at?: string | null
          id?: number
          quantity_required?: number | null
          training_resource_id?: number
          training_session_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_session_resources_training_resource_id_fkey"
            columns: ["training_resource_id"]
            isOneToOne: false
            referencedRelation: "training_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_resources_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_session_swaps: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          deadline_date: string | null
          id: number
          original_assignment_id: number
          original_session_id: number
          priority_level: number | null
          rejection_reason: string | null
          request_date: string | null
          request_reason: string
          requesting_employee_id: number
          swap_type: string
          target_employee_id: number
          target_session_id: number | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deadline_date?: string | null
          id?: number
          original_assignment_id: number
          original_session_id: number
          priority_level?: number | null
          rejection_reason?: string | null
          request_date?: string | null
          request_reason: string
          requesting_employee_id: number
          swap_type?: string
          target_employee_id: number
          target_session_id?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deadline_date?: string | null
          id?: number
          original_assignment_id?: number
          original_session_id?: number
          priority_level?: number | null
          rejection_reason?: string | null
          request_date?: string | null
          request_reason?: string
          requesting_employee_id?: number
          swap_type?: string
          target_employee_id?: number
          target_session_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_session_swaps_original_assignment_id_fkey"
            columns: ["original_assignment_id"]
            isOneToOne: false
            referencedRelation: "training_session_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_swaps_original_session_id_fkey"
            columns: ["original_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_swaps_requesting_employee_id_fkey"
            columns: ["requesting_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_swaps_target_employee_id_fkey"
            columns: ["target_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_swaps_target_session_id_fkey"
            columns: ["target_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          authority_id: number | null
          certificate_validity_months: number | null
          certification_awarded: boolean | null
          cost_per_participant: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_hours: number | null
          end_date: string
          end_time: string | null
          id: number
          instructor_name: string | null
          is_mandatory: boolean | null
          location: string | null
          materials_required: string | null
          max_participants: number | null
          min_participants: number | null
          notes: string | null
          prerequisites: string | null
          priority_level: number | null
          session_code: string
          session_name: string
          start_date: string
          start_time: string | null
          status: string | null
          training_type_id: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          authority_id?: number | null
          certificate_validity_months?: number | null
          certification_awarded?: boolean | null
          cost_per_participant?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          end_date: string
          end_time?: string | null
          id?: number
          instructor_name?: string | null
          is_mandatory?: boolean | null
          location?: string | null
          materials_required?: string | null
          max_participants?: number | null
          min_participants?: number | null
          notes?: string | null
          prerequisites?: string | null
          priority_level?: number | null
          session_code: string
          session_name: string
          start_date: string
          start_time?: string | null
          status?: string | null
          training_type_id: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          authority_id?: number | null
          certificate_validity_months?: number | null
          certification_awarded?: boolean | null
          cost_per_participant?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          end_date?: string
          end_time?: string | null
          id?: number
          instructor_name?: string | null
          is_mandatory?: boolean | null
          location?: string | null
          materials_required?: string | null
          max_participants?: number | null
          min_participants?: number | null
          notes?: string | null
          prerequisites?: string | null
          priority_level?: number | null
          session_code?: string
          session_name?: string
          start_date?: string
          start_time?: string | null
          status?: string | null
          training_type_id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "authorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_training_type_id_fkey"
            columns: ["training_type_id"]
            isOneToOne: false
            referencedRelation: "training_types"
            referencedColumns: ["id"]
          },
        ]
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
      allocate_roster_may_june_2025: { Args: never; Returns: string }
      allocate_roster_may_june_2025_fixed: { Args: never; Returns: string }
      allocate_roster_may_june_2025_shuffled: { Args: never; Returns: string }
      allocate_roster_may_june_2025_simple: { Args: never; Returns: string }
      allocate_roster_may_june_2025_weekend_offs: {
        Args: never
        Returns: string
      }
      analyze_off_day_distribution: {
        Args: never
        Returns: {
          day_name: string
          day_number: number
          percentage: number
          total_offs: number
        }[]
      }
      assign_blank_entries_to_av: {
        Args: never
        Returns: {
          action_taken: string
          assignment_date: string
          employee_id: number
          employee_name: string
        }[]
      }
      assign_employees_to_codes_with_dates: { Args: never; Returns: undefined }
      authenticate_user: {
        Args: { p_password: string; p_username: string }
        Returns: {
          authenticated: boolean
          id: number
          user_name: string
        }[]
      }
      clear_aircraft_data: { Args: never; Returns: undefined }
      create_schedule_data: { Args: never; Returns: undefined }
      generate_all_personnel_requirements: { Args: never; Returns: undefined }
      generate_attendance_may_1_to_25_2025: { Args: never; Returns: undefined }
      generate_detailed_assignment_report: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          assignment_date: string
          core_assignment: string
          employee_name: string
          employee_number: number
          job_title: string
          roster_description: string
          roster_status: string
          support_assignment: string
        }[]
      }
      generate_employee_assignments: { Args: never; Returns: string }
      generate_employee_authorizations: {
        Args: { p_number_of_records: number }
        Returns: undefined
      }
      generate_hangar_visits: { Args: never; Returns: undefined }
      generate_may_roster_report: {
        Args: never
        Returns: {
          "E#": number
          "May-1": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          Name: string
        }[]
      }
      generate_may_roster_report_shuffled: {
        Args: never
        Returns: {
          "E#": number
          "May-1": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          Name: string
          Pattern_Summary: string
        }[]
      }
      generate_realistic_roster_may_june_2025: {
        Args: never
        Returns: undefined
      }
      generate_registration_by_authority: {
        Args: { authority: string }
        Returns: string
      }
      generate_roster_may_june_2025: { Args: never; Returns: undefined }
      generate_roster_report_sample: {
        Args: never
        Returns: {
          Core: string
          "E#": number
          "Jun-1": string
          "Jun-10": string
          "Jun-11": string
          "Jun-12": string
          "Jun-13": string
          "Jun-14": string
          "Jun-15": string
          "Jun-2": string
          "Jun-3": string
          "Jun-4": string
          "Jun-5": string
          "Jun-6": string
          "Jun-7": string
          "Jun-8": string
          "Jun-9": string
          "May-1": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          Name: string
          Support: string
          Team: string
          Title: string
        }[]
      }
      generate_training_schedules: { Args: never; Returns: undefined }
      generate_weekend_roster_report: {
        Args: never
        Returns: {
          "E#": number
          "May-1": string
          "May-10": string
          "May-11": string
          "May-12": string
          "May-13": string
          "May-14": string
          "May-15": string
          "May-2": string
          "May-3": string
          "May-4": string
          "May-5": string
          "May-6": string
          "May-7": string
          "May-8": string
          "May-9": string
          Name: string
          Off_Pattern: string
        }[]
      }
      get_employee_project_assignments: {
        Args: { p_date?: string }
        Returns: {
          assignment_code: string
          assignment_date: string
          assignment_type: string
          employee_id: number
          employee_name: string
          employee_number: number
          project_details: string
        }[]
      }
      get_employee_roster: {
        Args: never
        Returns: {
          date: string
          employee_id: number
          id: number
          notes: string
          status_code: string
        }[]
      }
      get_project_assignment_summary: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          assignment_date: string
          available_assignments: number
          core_assignments: number
          support_assignments: number
          total_working_employees: number
          unassigned_employees: number
        }[]
      }
      import_csv_certifications: {
        Args: never
        Returns: {
          errors: number
          inserted: number
          processed: number
          skipped: number
        }[]
      }
      migrate_certifications_to_authorizations: {
        Args: never
        Returns: undefined
      }
      populate_aircraft_from_schedule: { Args: never; Returns: undefined }
      populate_aircraft_models: { Args: never; Returns: undefined }
      populate_aircraft_types: { Args: never; Returns: undefined }
      populate_assignment_codes: { Args: never; Returns: undefined }
      populate_authorities_and_validity: { Args: never; Returns: undefined }
      populate_engine_types: { Args: never; Returns: undefined }
      populate_hangars: { Args: never; Returns: undefined }
      populate_maintenance_visits_from_schedule: {
        Args: never
        Returns: undefined
      }
      populate_personnel_requirements_only: { Args: never; Returns: undefined }
      setup_aircraft_maintenance_data: { Args: never; Returns: undefined }
      show_employee_pattern: {
        Args: { days_to_show?: number; emp_num: number; start_date?: string }
        Returns: {
          cycle_day: number
          date_val: string
          day_name: string
          pattern_note: string
          roster_code: string
        }[]
      }
      test_roster_allocation: {
        Args: never
        Returns: {
          day_of_week: string
          employee_name: string
          employee_number: number
          roster_code: string
          roster_date: string
        }[]
      }
      update_certifications_with_new_aircraft: {
        Args: never
        Returns: undefined
      }
      validate_roster_patterns: {
        Args: never
        Returns: {
          employee_name: string
          employee_number: number
          issue_date: string
          issue_description: string
        }[]
      }
      validate_roster_patterns_enhanced: {
        Args: never
        Returns: {
          employee_name: string
          employee_number: number
          issue_description: string
          pattern_found: string
          week_start_date: string
        }[]
      }
      validate_roster_patterns_fixed: {
        Args: never
        Returns: {
          employee_name: string
          employee_number: number
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

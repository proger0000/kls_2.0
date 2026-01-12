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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_attendance: {
        Row: {
          attendance_date: string
          candidate_id: number
          created_at: string | null
          id: number
          marked_by_user_id: number | null
          status: string | null
        }
        Insert: {
          attendance_date: string
          candidate_id: number
          created_at?: string | null
          id: number
          marked_by_user_id?: number | null
          status?: string | null
        }
        Update: {
          attendance_date?: string
          candidate_id?: number
          created_at?: string | null
          id?: number
          marked_by_user_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_attendance_candidate"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "academy_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_marker"
            columns: ["marked_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_candidates: {
        Row: {
          created_at: string | null
          enrollment_date: string | null
          full_name: string | null
          group_id: number | null
          id: number
          linked_user_id: number | null
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_date?: string | null
          full_name?: string | null
          group_id?: number | null
          id: number
          linked_user_id?: number | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_date?: string | null
          full_name?: string | null
          group_id?: number | null
          id?: number
          linked_user_id?: number | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_candidates_group"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "academy_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_candidates_user"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_groups: {
        Row: {
          created_at: string | null
          id: number
          name: string | null
          trainer_user_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          name?: string | null
          trainer_user_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string | null
          trainer_user_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_academy_groups_trainer"
            columns: ["trainer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_standard_results: {
        Row: {
          attempt_date: string
          candidate_id: number
          comments: string | null
          created_at: string | null
          id: number
          marked_by_user_id: number | null
          passed: number | null
          result_value: string | null
          standard_type_id: number
          updated_at: string | null
        }
        Insert: {
          attempt_date: string
          candidate_id: number
          comments?: string | null
          created_at?: string | null
          id: number
          marked_by_user_id?: number | null
          passed?: number | null
          result_value?: string | null
          standard_type_id: number
          updated_at?: string | null
        }
        Update: {
          attempt_date?: string
          candidate_id?: number
          comments?: string | null
          created_at?: string | null
          id?: number
          marked_by_user_id?: number | null
          passed?: number | null
          result_value?: string | null
          standard_type_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_std_results_candidate"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "academy_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_std_results_marker"
            columns: ["marked_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_std_results_type"
            columns: ["standard_type_id"]
            isOneToOne: false
            referencedRelation: "academy_standard_types"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_standard_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: number
          name: string | null
          pass_criteria: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: number
          is_active: number
          name?: string | null
          pass_criteria?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: number
          name?: string | null
          pass_criteria?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      academy_tests: {
        Row: {
          candidate_id: number
          comments: string | null
          created_at: string | null
          id: number
          marked_by_user_id: number | null
          score: number | null
          test_date: string
          updated_at: string | null
        }
        Insert: {
          candidate_id: number
          comments?: string | null
          created_at?: string | null
          id: number
          marked_by_user_id?: number | null
          score?: number | null
          test_date: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: number
          comments?: string | null
          created_at?: string | null
          id?: number
          marked_by_user_id?: number | null
          score?: number | null
          test_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tests_candidate"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "academy_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tests_marker"
            columns: ["marked_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      action_log: {
        Row: {
          action_description: string | null
          details: string | null
          id: number
          target_shift_id: number | null
          timestamp: string
          user_id: number
        }
        Insert: {
          action_description?: string | null
          details?: string | null
          id: number
          target_shift_id?: number | null
          timestamp: string
          user_id: number
        }
        Update: {
          action_description?: string | null
          details?: string | null
          id?: number
          target_shift_id?: number | null
          timestamp?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_action_log_shift"
            columns: ["target_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_action_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      beach_analytics_logs: {
        Row: {
          created_at: string
          date: string
          id: number
          land_count: number | null
          post_id: number | null
          time_slot: string
          water_count: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: number
          land_count?: number | null
          post_id?: number | null
          time_slot: string
          water_count?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: number
          land_count?: number | null
          post_id?: number | null
          time_slot?: string
          water_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beach_analytics_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beach_analytics_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "view_analytics_general"
            referencedColumns: ["post_id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          email: string | null
          id: number
          is_read: number | null
          message: string | null
          name: string | null
          received_at: string
        }
        Insert: {
          email?: string | null
          id: number
          is_read?: number | null
          message?: string | null
          name?: string | null
          received_at: string
        }
        Update: {
          email?: string | null
          id?: number
          is_read?: number | null
          message?: string | null
          name?: string | null
          received_at?: string
        }
        Relationships: []
      }
      junior_applications: {
        Row: {
          can_swim: string | null
          child_birthdate: string
          child_name: string | null
          id: number
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          registration_datetime: string
          sport_details: string | null
          sport_engagement: string | null
          swim_level: number | null
        }
        Insert: {
          can_swim?: string | null
          child_birthdate: string
          child_name?: string | null
          id: number
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          registration_datetime: string
          sport_details?: string | null
          sport_engagement?: string | null
          swim_level?: number | null
        }
        Update: {
          can_swim?: string | null
          child_birthdate?: string
          child_name?: string | null
          id?: number
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          registration_datetime?: string
          sport_details?: string | null
          sport_engagement?: string | null
          swim_level?: number | null
        }
        Relationships: []
      }
      lifeguard_applications: {
        Row: {
          birth_date: string
          comments_history: string | null
          email: string | null
          fname: string | null
          history: string | null
          id: number
          lname: string | null
          manager_id: number | null
          manager_name: string | null
          manager_note: string | null
          name: string | null
          phone: string | null
          registration_datetime: string
          status: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          comments_history?: string | null
          email?: string | null
          fname?: string | null
          history?: string | null
          id: number
          lname?: string | null
          manager_id?: number | null
          manager_name?: string | null
          manager_note?: string | null
          name?: string | null
          phone?: string | null
          registration_datetime: string
          status?: string | null
          updated_at: string
        }
        Update: {
          birth_date?: string
          comments_history?: string | null
          email?: string | null
          fname?: string | null
          history?: string | null
          id?: number
          lname?: string | null
          manager_id?: number | null
          manager_name?: string | null
          manager_note?: string | null
          name?: string | null
          phone?: string | null
          registration_datetime?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_applications_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lifeguard_shift_points: {
        Row: {
          award_datetime: string | null
          awarded_by_user_id: number | null
          base_points_from_rule: number
          coefficient_applied: number | null
          comment: string | null
          id: number
          points_awarded: number
          rule_id: number
          shift_id: number
          user_id: number
        }
        Insert: {
          award_datetime?: string | null
          awarded_by_user_id?: number | null
          base_points_from_rule: number
          coefficient_applied?: number | null
          comment?: string | null
          id?: number
          points_awarded: number
          rule_id: number
          shift_id: number
          user_id: number
        }
        Update: {
          award_datetime?: string | null
          awarded_by_user_id?: number | null
          base_points_from_rule?: number
          coefficient_applied?: number | null
          comment?: string | null
          id?: number
          points_awarded?: number
          rule_id?: number
          shift_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_lsp_awarded_by"
            columns: ["awarded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lsp_rule"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "points"
            referencedColumns: ["id_balls"]
          },
          {
            foreignKeyName: "fk_lsp_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lsp_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      new2024: {
        Row: {
          comments_history: string | null
          data: string
          email: string | null
          fname: string | null
          history: string | null
          id: number
          lname: string | null
          manager_id: number | null
          manager_name: string | null
          manager_note: string | null
          name: string | null
          phone: string | null
          registration_datetime: string | null
          status: string | null
        }
        Insert: {
          comments_history?: string | null
          data: string
          email?: string | null
          fname?: string | null
          history?: string | null
          id: number
          lname?: string | null
          manager_id?: number | null
          manager_name?: string | null
          manager_note?: string | null
          name?: string | null
          phone?: string | null
          registration_datetime?: string | null
          status?: string | null
        }
        Update: {
          comments_history?: string | null
          data?: string
          email?: string | null
          fname?: string | null
          history?: string | null
          id?: number
          lname?: string | null
          manager_id?: number | null
          manager_name?: string | null
          manager_note?: string | null
          name?: string | null
          phone?: string | null
          registration_datetime?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_new2024_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points: {
        Row: {
          comment_balls: string | null
          id_balls: number
          name_balls: string | null
          quantity: number
        }
        Insert: {
          comment_balls?: string | null
          id_balls: number
          name_balls?: string | null
          quantity: number
        }
        Update: {
          comment_balls?: string | null
          id_balls?: number
          name_balls?: string | null
          quantity?: number
        }
        Relationships: []
      }
      pool_bookings: {
        Row: {
          applicant_phone: string | null
          created_at: string
          id: number
          training_date: string
          training_time: string | null
        }
        Insert: {
          applicant_phone?: string | null
          created_at: string
          id: number
          training_date: string
          training_time?: string | null
        }
        Update: {
          applicant_phone?: string | null
          created_at?: string
          id?: number
          training_date?: string
          training_time?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          complexity_coefficient: number | null
          created_at: string
          id: number
          location_description: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          complexity_coefficient?: number | null
          created_at: string
          id: number
          location_description?: string | null
          name?: string | null
          updated_at: string
        }
        Update: {
          complexity_coefficient?: number | null
          created_at?: string
          id?: number
          location_description?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_history: {
        Row: {
          changed_at: string | null
          changed_by_user_id: number | null
          id: number
          new_rate: number | null
          old_rate: number | null
          user_id: number
        }
        Insert: {
          changed_at?: string | null
          changed_by_user_id?: number | null
          id: number
          new_rate?: number | null
          old_rate?: number | null
          user_id: number
        }
        Update: {
          changed_at?: string | null
          changed_by_user_id?: number | null
          id?: number
          new_rate?: number | null
          old_rate?: number | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_rate_history_changer"
            columns: ["changed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rate_history_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_incidents: {
        Row: {
          actions_taken: string | null
          cause_details: string | null
          id: number
          incident_description: string | null
          incident_time: string | null
          incident_type: string | null
          involved_lifeguard_id: number | null
          outcome_details: string | null
          responding_unit_details: string | null
          shift_report_id: number
          subject_age: number | null
          subject_gender: string | null
          subject_name: string | null
          subject_phone: string | null
          witness1_name: string | null
          witness1_phone: string | null
          witness2_name: string | null
          witness2_phone: string | null
        }
        Insert: {
          actions_taken?: string | null
          cause_details?: string | null
          id: number
          incident_description?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_lifeguard_id?: number | null
          outcome_details?: string | null
          responding_unit_details?: string | null
          shift_report_id: number
          subject_age?: number | null
          subject_gender?: string | null
          subject_name?: string | null
          subject_phone?: string | null
          witness1_name?: string | null
          witness1_phone?: string | null
          witness2_name?: string | null
          witness2_phone?: string | null
        }
        Update: {
          actions_taken?: string | null
          cause_details?: string | null
          id?: number
          incident_description?: string | null
          incident_time?: string | null
          incident_type?: string | null
          involved_lifeguard_id?: number | null
          outcome_details?: string | null
          responding_unit_details?: string | null
          shift_report_id?: number
          subject_age?: number | null
          subject_gender?: string | null
          subject_name?: string | null
          subject_phone?: string | null
          witness1_name?: string | null
          witness1_phone?: string | null
          witness2_name?: string | null
          witness2_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_incidents_lifeguard"
            columns: ["involved_lifeguard_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_incidents_report"
            columns: ["shift_report_id"]
            isOneToOne: false
            referencedRelation: "shift_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_incidents_report"
            columns: ["shift_report_id"]
            isOneToOne: false
            referencedRelation: "view_admin_reports"
            referencedColumns: ["report_id"]
          },
        ]
      }
      shift_reports: {
        Row: {
          alcohol_drinking_prevented_count: number | null
          alcohol_water_prevented_count: number | null
          bridge_jumpers_count: number | null
          educational_activities_count: number | null
          general_notes: string | null
          id: number
          people_in_water_estimated: number | null
          people_on_beach_estimated: number | null
          preventive_actions_count: number | null
          report_submitted_at: string
          reporter_user_id: number
          shift_id: number
          suspicious_swimmers_count: number | null
          visitor_inquiries_count: number | null
          watercraft_stopped_count: number | null
        }
        Insert: {
          alcohol_drinking_prevented_count?: number | null
          alcohol_water_prevented_count?: number | null
          bridge_jumpers_count?: number | null
          educational_activities_count?: number | null
          general_notes?: string | null
          id: number
          people_in_water_estimated?: number | null
          people_on_beach_estimated?: number | null
          preventive_actions_count?: number | null
          report_submitted_at: string
          reporter_user_id: number
          shift_id: number
          suspicious_swimmers_count?: number | null
          visitor_inquiries_count?: number | null
          watercraft_stopped_count?: number | null
        }
        Update: {
          alcohol_drinking_prevented_count?: number | null
          alcohol_water_prevented_count?: number | null
          bridge_jumpers_count?: number | null
          educational_activities_count?: number | null
          general_notes?: string | null
          id?: number
          people_in_water_estimated?: number | null
          people_on_beach_estimated?: number | null
          preventive_actions_count?: number | null
          report_submitted_at?: string
          reporter_user_id?: number
          shift_id?: number
          suspicious_swimmers_count?: number | null
          visitor_inquiries_count?: number | null
          watercraft_stopped_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reports_user"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          activity_type: string | null
          created_at: string
          end_time: string | null
          id: number
          lifeguard_assignment_type: number | null
          manual_close_comment: string | null
          manual_closed_by: number | null
          manual_opened_by: number | null
          photo_close_approved: number | null
          photo_close_path: string | null
          photo_close_uploaded_at: string | null
          points: number | null
          post_id: number
          rounded_work_hours: number | null
          start_photo_approved_at: string | null
          start_photo_approved_by: number | null
          start_photo_path: string | null
          start_time: string
          status: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          activity_type?: string | null
          created_at: string
          end_time?: string | null
          id: number
          lifeguard_assignment_type?: number | null
          manual_close_comment?: string | null
          manual_closed_by?: number | null
          manual_opened_by?: number | null
          photo_close_approved?: number | null
          photo_close_path?: string | null
          photo_close_uploaded_at?: string | null
          points?: number | null
          post_id: number
          rounded_work_hours?: number | null
          start_photo_approved_at?: string | null
          start_photo_approved_by?: number | null
          start_photo_path?: string | null
          start_time: string
          status?: string | null
          updated_at: string
          user_id: number
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          end_time?: string | null
          id?: number
          lifeguard_assignment_type?: number | null
          manual_close_comment?: string | null
          manual_closed_by?: number | null
          manual_opened_by?: number | null
          photo_close_approved?: number | null
          photo_close_path?: string | null
          photo_close_uploaded_at?: string | null
          points?: number | null
          post_id?: number
          rounded_work_hours?: number | null
          start_photo_approved_at?: string | null
          start_photo_approved_by?: number | null
          start_photo_path?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_shifts_manual_closed_by"
            columns: ["manual_closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_shifts_manual_opened_by"
            columns: ["manual_opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_shifts_photo_approved_by"
            columns: ["start_photo_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_shifts_posts"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_shifts_posts"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "view_analytics_general"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "fk_shifts_users"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          base_hourly_rate: number | null
          contract_number: string | null
          created_at: string
          current_month_points: number | null
          email: string | null
          full_name: string | null
          id: number
          password_hash: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          base_hourly_rate?: number | null
          contract_number?: string | null
          created_at: string
          current_month_points?: number | null
          email?: string | null
          full_name?: string | null
          id: number
          password_hash?: string | null
          role?: string | null
          updated_at: string
        }
        Update: {
          auth_id?: string | null
          base_hourly_rate?: number | null
          contract_number?: string | null
          created_at?: string
          current_month_points?: number | null
          email?: string | null
          full_name?: string | null
          id?: number
          password_hash?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      winter_stories: {
        Row: {
          age: string | null
          goes_on_ice: string | null
          had_incidents: string | null
          help_action: string | null
          id: number
          instagram: string | null
          knows_dangers: string | null
          name: string | null
          school: string | null
          story: string | null
          submission_datetime: string
        }
        Insert: {
          age?: string | null
          goes_on_ice?: string | null
          had_incidents?: string | null
          help_action?: string | null
          id: number
          instagram?: string | null
          knows_dangers?: string | null
          name?: string | null
          school?: string | null
          story?: string | null
          submission_datetime: string
        }
        Update: {
          age?: string | null
          goes_on_ice?: string | null
          had_incidents?: string | null
          help_action?: string | null
          id?: number
          instagram?: string | null
          knows_dangers?: string | null
          name?: string | null
          school?: string | null
          story?: string | null
          submission_datetime?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_admin_reports: {
        Row: {
          count_ambulance: number | null
          count_first_aid: number | null
          count_lost_child: number | null
          count_police: number | null
          count_rescue: number | null
          general_notes: string | null
          people_in_water_estimated: number | null
          people_on_beach_estimated: number | null
          post_name: string | null
          report_id: number | null
          report_submitted_at: string | null
          shift_date: string | null
          shift_id: number | null
          suspicious_swimmers_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      view_analytics_by_post: {
        Row: {
          avg_land: number | null
          avg_water: number | null
          date: string | null
          peak_load: number | null
          post_id: number | null
          total_visitors: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beach_analytics_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beach_analytics_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "view_analytics_general"
            referencedColumns: ["post_id"]
          },
        ]
      }
      view_analytics_daily: {
        Row: {
          avg_land: number | null
          avg_water: number | null
          date: string | null
          peak_load: number | null
          total_visitors: number | null
        }
        Relationships: []
      }
      view_analytics_demographics: {
        Row: {
          age_group: string | null
          id: number | null
          incident_date: string | null
          incident_type: string | null
          subject_age: number | null
          subject_gender: string | null
        }
        Relationships: []
      }
      view_analytics_general: {
        Row: {
          complexity_coefficient: number | null
          post_id: number | null
          post_name: string | null
          safety_index: number | null
          total_incidents: number | null
          total_people_beach: number | null
          total_people_water: number | null
          total_preventive: number | null
          total_shifts: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_profile_by_email: {
        Args: { email_input: string }
        Returns: {
          auth_id: string | null
          base_hourly_rate: number | null
          contract_number: string | null
          created_at: string
          current_month_points: number | null
          email: string | null
          full_name: string | null
          id: number
          password_hash: string | null
          role: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          organization: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          organization?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          organization?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          state: string;
          petition_type: string;
          description: string | null;
          deadline: string | null;
          status: "draft" | "active" | "completed" | "archived";
          total_signatures: number;
          verified_count: number;
          invalid_count: number;
          flagged_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          state: string;
          petition_type: string;
          description?: string | null;
          deadline?: string | null;
          status?: "draft" | "active" | "completed" | "archived";
          total_signatures?: number;
          verified_count?: number;
          invalid_count?: number;
          flagged_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          state?: string;
          petition_type?: string;
          description?: string | null;
          deadline?: string | null;
          status?: "draft" | "active" | "completed" | "archived";
          total_signatures?: number;
          verified_count?: number;
          invalid_count?: number;
          flagged_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      petition_sheets: {
        Row: {
          id: string;
          project_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          sheet_number: number;
          ocr_status: "pending" | "processing" | "completed" | "failed";
          ocr_raw_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          sheet_number?: number;
          ocr_status?: "pending" | "processing" | "completed" | "failed";
          ocr_raw_text?: string | null;
          created_at?: string;
        };
        Update: {
          sheet_number?: number;
          ocr_status?: "pending" | "processing" | "completed" | "failed";
          ocr_raw_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "petition_sheets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      signatures: {
        Row: {
          id: string;
          project_id: string;
          sheet_id: string;
          line_number: number;
          extracted_name: string;
          extracted_address: string;
          extracted_date: string | null;
          status: "pending" | "verified" | "invalid" | "flagged" | "skipped";
          matched_voter_name: string | null;
          matched_voter_address: string | null;
          matched_voter_party: string | null;
          match_confidence: number | null;
          match_method: "auto" | "manual" | null;
          flagged_reason: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          sheet_id: string;
          line_number: number;
          extracted_name: string;
          extracted_address: string;
          extracted_date?: string | null;
          status?: "pending" | "verified" | "invalid" | "flagged" | "skipped";
          matched_voter_name?: string | null;
          matched_voter_address?: string | null;
          matched_voter_party?: string | null;
          match_confidence?: number | null;
          match_method?: "auto" | "manual" | null;
          flagged_reason?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "verified" | "invalid" | "flagged" | "skipped";
          matched_voter_name?: string | null;
          matched_voter_address?: string | null;
          matched_voter_party?: string | null;
          match_confidence?: number | null;
          match_method?: "auto" | "manual" | null;
          flagged_reason?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "signatures_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "signatures_sheet_id_fkey";
            columns: ["sheet_id"];
            isOneToOne: false;
            referencedRelation: "petition_sheets";
            referencedColumns: ["id"];
          },
        ];
      };
      voter_files: {
        Row: {
          id: string;
          project_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          record_count: number;
          parsed_status: "pending" | "processing" | "completed" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          record_count?: number;
          parsed_status?: "pending" | "processing" | "completed" | "failed";
          created_at?: string;
        };
        Update: {
          record_count?: number;
          parsed_status?: "pending" | "processing" | "completed" | "failed";
        };
        Relationships: [
          {
            foreignKeyName: "voter_files_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      voters: {
        Row: {
          id: string;
          voter_file_id: string;
          project_id: string;
          full_name: string;
          address: string;
          city: string | null;
          state: string | null;
          zip: string | null;
          party: string | null;
          registration_date: string | null;
          voter_id_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_file_id: string;
          project_id: string;
          full_name: string;
          address: string;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          party?: string | null;
          registration_date?: string | null;
          voter_id_number?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          address?: string;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          party?: string | null;
          registration_date?: string | null;
          voter_id_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "voters_voter_file_id_fkey";
            columns: ["voter_file_id"];
            isOneToOne: false;
            referencedRelation: "voter_files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "voters_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          action: string;
          details: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          action: string;
          details?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

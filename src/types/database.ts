export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      credit_packages: {
        Row: {
          id: string;
          name: string;
          credits: number;
          price_thb: number;
          price_satang: number;
          discount_percent: number;
          is_popular: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          credits: number;
          price_thb: number;
          price_satang: number;
          discount_percent?: number;
          is_popular?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          credits?: number;
          price_thb?: number;
          price_satang?: number;
          discount_percent?: number;
          is_popular?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          total_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          total_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          total_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          balance_after: number;
          package_id: string | null;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          memory_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          balance_after: number;
          package_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          memory_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          balance_after?: number;
          package_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          memory_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          phone: string | null;
          birthday: string | null;
          gender: string | null;
          job: string | null;
          relationship_status: string | null;
          occasion_type: string | null;
          profile_credits_claimed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone?: string | null;
          birthday?: string | null;
          gender?: string | null;
          job?: string | null;
          relationship_status?: string | null;
          occasion_type?: string | null;
          profile_credits_claimed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          phone?: string | null;
          birthday?: string | null;
          gender?: string | null;
          job?: string | null;
          relationship_status?: string | null;
          occasion_type?: string | null;
          profile_credits_claimed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cartoon_generations: {
        Row: {
          id: string;
          user_id: string;
          original_image_url: string | null;
          cartoon_image_url: string | null;
          credits_used: number;
          prompt: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_image_url?: string | null;
          cartoon_image_url?: string | null;
          credits_used?: number;
          prompt?: string | null;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_image_url?: string | null;
          cartoon_image_url?: string | null;
          credits_used?: number;
          prompt?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

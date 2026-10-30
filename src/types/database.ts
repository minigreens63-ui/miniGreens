// Hand-written to match supabase/migrations/20260818190000_init_schema.sql and
// supabase/migrations/20260819120000_partners.sql.
// Regenerate with `supabase gen types typescript --db-url <url> --schema public`
// once Docker is available locally, and diff against this file before replacing it.

export type UserRole = 'customer' | 'partner' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type PartnerBusinessType =
  | 'individual'
  | 'women'
  | 'cafe'
  | 'restaurant'
  | 'shop'
  | 'fitness_wellness'
  | 'community';
export type PartnerStatus = 'pending' | 'approved' | 'rejected';
export type OrderType = 'standard' | 'business' | 'preorder' | 'subscription';
export type DiscountType = 'percentage' | 'flat';
export type DiscountTarget = 'all' | 'category' | 'product' | 'subscription_plan' | 'partner' | 'wholesale';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'rejected';
export type KycStatus = 'pending' | 'verified' | 'rejected';

export interface KycDocument {
  name: string;
  path: string;
  uploaded_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          email: string | null;
          phone: string | null;
          avatar: string | null;
          date_of_birth: string | null;
          preferences: string[];
          push_token: string | null;
          whatsapp_number: string | null;
          whatsapp_verified_at: string | null;
          whatsapp_opt_in: boolean;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          avatar?: string | null;
          date_of_birth?: string | null;
          preferences?: string[];
          push_token?: string | null;
          whatsapp_number?: string | null;
          whatsapp_verified_at?: string | null;
          whatsapp_opt_in?: boolean;
          is_super_admin?: boolean;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string;
          full_name: string;
          phone: string;
          street: string;
          apartment: string | null;
          city: string;
          state: string;
          zip_code: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'addresses_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image: string | null;
          icon: string | null;
          color: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'sort_order' | 'is_active'> & {
          id?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          price: number;
          original_price: number | null;
          category_id: string | null;
          images: string[];
          unit: string | null;
          weight: string | null;
          nutrition: Record<string, unknown> | null;
          benefits: string[];
          ingredients: string[] | null;
          storage: string | null;
          consumption_tips: string[];
          is_featured: boolean;
          is_seasonal: boolean;
          is_best_seller: boolean;
          rating: number;
          review_count: number;
          stock: number;
          is_available: boolean;
          is_preorder: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          unit: string | null;
          delivery_frequency: string | null;
          items: string[];
          benefits: string[];
          is_popular: boolean;
          color: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscription_plans']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['subscription_plans']['Insert']>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          plan_id: string | null;
          status: SubscriptionStatus;
          address_id: string | null;
          next_delivery_date: string | null;
          started_at: string;
          paused_at: string | null;
          cancelled_at: string | null;
          last_order_generated_at: string | null;
          terms_accepted: boolean;
          sms_whatsapp_consent: boolean;
          is_custom: boolean;
          custom_frequency: 'weekly' | 'monthly' | null;
        };
        Insert: Omit<
          Database['public']['Tables']['subscriptions']['Row'],
          'id' | 'started_at' | 'last_order_generated_at' | 'paused_at' | 'cancelled_at' | 'terms_accepted' | 'sms_whatsapp_consent' | 'is_custom' | 'custom_frequency'
        > & {
          id?: string;
          last_order_generated_at?: string | null;
          paused_at?: string | null;
          cancelled_at?: string | null;
          terms_accepted?: boolean;
          sms_whatsapp_consent?: boolean;
          is_custom?: boolean;
          custom_frequency?: 'weekly' | 'monthly' | null;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'subscriptions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_items: {
        Row: {
          id: string;
          subscription_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscription_items']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['subscription_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'subscription_items_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscription_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          profile_id: string;
          status: OrderStatus;
          subtotal: number;
          delivery_fee: number;
          total: number;
          delivery_address_id: string | null;
          delivery_date: string | null;
          delivery_time: string | null;
          notes: string | null;
          order_type: OrderType;
          business_name: string | null;
          contact_person: string | null;
          business_phone: string | null;
          business_address: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          payment_status: PaymentStatus;
          discount_code: string | null;
          discount_amount: number;
          expected_availability_date: string | null;
          oversold: boolean;
          is_gift: boolean;
          gift_occasion: string | null;
          gift_recipient_name: string | null;
          gift_recipient_phone: string | null;
          gift_recipient_address: string | null;
          gift_sender_name: string | null;
          gift_sender_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at' | 'razorpay_order_id' | 'razorpay_payment_id' | 'razorpay_signature' | 'payment_status' | 'discount_code' | 'discount_amount' | 'expected_availability_date' | 'oversold' | 'is_gift' | 'gift_occasion' | 'gift_recipient_name' | 'gift_recipient_phone' | 'gift_recipient_address' | 'gift_sender_name' | 'gift_sender_phone'> & {
          id?: string;
          oversold?: boolean;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          payment_status?: PaymentStatus;
          discount_code?: string | null;
          discount_amount?: number;
          expected_availability_date?: string | null;
          is_gift?: boolean;
          gift_occasion?: string | null;
          gift_recipient_name?: string | null;
          gift_recipient_phone?: string | null;
          gift_recipient_address?: string | null;
          gift_sender_name?: string | null;
          gift_sender_phone?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'orders_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_delivery_address_id_fkey';
            columns: ['delivery_address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          price: number;
          image: string | null;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      partners: {
        Row: {
          id: string;
          profile_id: string;
          business_type: PartnerBusinessType;
          business_name: string;
          contact_person: string;
          phone: string;
          address: string | null;
          status: PartnerStatus;
          platform_fee_percent: number;
          applied_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          kyc_documents: KycDocument[];
          kyc_status: KycStatus;
          payout_eligible: boolean;
        };
        Insert: Omit<
          Database['public']['Tables']['partners']['Row'],
          | 'id'
          | 'status'
          | 'platform_fee_percent'
          | 'applied_at'
          | 'reviewed_at'
          | 'reviewed_by'
          | 'kyc_documents'
          | 'kyc_status'
          | 'payout_eligible'
        > & {
          id?: string;
          status?: PartnerStatus;
          platform_fee_percent?: number;
          kyc_documents?: KycDocument[];
          kyc_status?: KycStatus;
          payout_eligible?: boolean;
        };
        Update: Partial<Database['public']['Tables']['partners']['Insert']> & {
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'partners_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      discounts: {
        Row: {
          id: string;
          code: string | null;
          description: string | null;
          discount_type: DiscountType;
          value: number;
          target: DiscountTarget;
          target_id: string | null;
          min_order_value: number | null;
          max_discount_amount: number | null;
          is_birthday_offer: boolean;
          is_active: boolean;
          starts_at: string | null;
          expires_at: string | null;
          usage_limit: number | null;
          used_count: number;
          created_at: string;
          created_by: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['discounts']['Row'],
          'id' | 'is_birthday_offer' | 'is_active' | 'used_count' | 'created_at'
        > & {
          id?: string;
          is_birthday_offer?: boolean;
          is_active?: boolean;
          used_count?: number;
        };
        Update: Partial<Database['public']['Tables']['discounts']['Insert']>;
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          partner_id: string;
          amount: number;
          status: PayoutStatus;
          period_start: string | null;
          period_end: string | null;
          note: string | null;
          requested_at: string;
          paid_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['payouts']['Row'], 'id' | 'status' | 'requested_at' | 'paid_at'> & {
          id?: string;
          status?: PayoutStatus;
          requested_at?: string;
          paid_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'payouts_partner_id_fkey';
            columns: ['partner_id'];
            isOneToOne: false;
            referencedRelation: 'partners';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string;
          data: Record<string, unknown>;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'data' | 'read_at' | 'created_at'> & {
          id?: string;
          data?: Record<string, unknown>;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'notifications_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      consent_log: {
        Row: {
          id: string;
          profile_id: string;
          channel: 'whatsapp';
          granted: boolean;
          source: string;
          terms_version: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consent_log']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['consent_log']['Insert']>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          reason: string;
          message: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contact_messages']['Row'], 'id' | 'phone' | 'created_at'> & {
          id?: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      verify_razorpay_payment: {
        Args: {
          p_order_id: string;
          p_razorpay_payment_id: string;
          p_razorpay_signature: string;
        };
        Returns: boolean;
      };
      validate_discount: {
        Args: {
          p_code: string;
          p_subtotal: number;
        };
        Returns: {
          valid: boolean;
          reason: string | null;
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          discount_amount?: number;
        };
      };
      partner_earnings_summary: {
        Args: { p_partner_id: string };
        Returns: {
          error?: string;
          gross?: number;
          fee_percent?: number;
          fee?: number;
          net?: number;
          paid_out?: number;
          pending?: number;
          available?: number;
          payout_eligible?: boolean;
        };
      };
      request_payout: {
        Args: { p_partner_id: string };
        Returns: {
          ok?: boolean;
          payout_id?: string;
          amount?: number;
          error?: string;
        };
      };
      wholesale_discount_for_partner: {
        Args: { p_partner_id: string; p_subtotal: number };
        Returns: {
          applied: boolean;
          discount_id?: string;
          code?: string | null;
          discount_amount: number;
        };
      };
      generate_subscription_orders: {
        Args: Record<string, never>;
        Returns: {
          subscription_id: string;
          order_id: string | null;
          order_number: string | null;
          outcome: string;
        }[];
      };
      admin_generate_subscription_orders: {
        Args: Record<string, never>;
        Returns: {
          subscription_id: string;
          order_id: string | null;
          order_number: string | null;
          outcome: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      subscription_status: SubscriptionStatus;
      partner_business_type: PartnerBusinessType;
      partner_status: PartnerStatus;
      discount_type: DiscountType;
      discount_target: DiscountTarget;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          resurrection_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          resurrection_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          resurrection_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          ghost_letter: string | null
          causes_of_death: string[]
          project_type: string
          started_at: string | null
          died_at: string
          lifespan_months: number | null
          adoption_type: string
          adoption_price: number | null
          revenue_share_percent: number
          is_adopted: boolean
          adopted_by_id: string | null
          adopted_at: string | null
          is_public: boolean
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          ghost_letter?: string | null
          causes_of_death: string[]
          project_type: string
          started_at?: string | null
          died_at?: string
          adoption_type: string
          adoption_price?: number | null
          revenue_share_percent?: number
          is_adopted?: boolean
          adopted_by_id?: string | null
          adopted_at?: string | null
          is_public?: boolean
          featured?: boolean
        }
        Update: {
          title?: string
          description?: string | null
          ghost_letter?: string | null
          causes_of_death?: string[]
          project_type?: string
          started_at?: string | null
          died_at?: string
          adoption_type?: string
          adoption_price?: number | null
          revenue_share_percent?: number
          is_adopted?: boolean
          adopted_by_id?: string | null
          adopted_at?: string | null
          is_public?: boolean
          featured?: boolean
        }
        Relationships: []
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          file_name: string
          file_type: string | null
          file_size_bytes: number | null
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_name: string
          file_type?: string | null
          file_size_bytes?: number | null
          storage_path: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      autopsies: {
        Row: {
          id: string
          project_id: string
          pathologist_diagnosis: string | null
          pathologist_recommendation: string | null
          confidence_score: number | null
          community_diagnosis_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          pathologist_diagnosis?: string | null
          pathologist_recommendation?: string | null
          confidence_score?: number | null
          community_diagnosis_count?: number
        }
        Update: {
          pathologist_diagnosis?: string | null
          pathologist_recommendation?: string | null
          confidence_score?: number | null
          community_diagnosis_count?: number
        }
        Relationships: []
      }
      autopsy_comments: {
        Row: {
          id: string
          autopsy_id: string
          author_id: string
          comment_text: string
          alternative_causes: string[] | null
          upvotes: number
          created_at: string
        }
        Insert: {
          id?: string
          autopsy_id: string
          author_id: string
          comment_text: string
          alternative_causes?: string[] | null
          upvotes?: number
        }
        Update: {
          upvotes?: number
        }
        Relationships: []
      }
      adoptions: {
        Row: {
          id: string
          project_id: string
          adopter_id: string
          creator_id: string
          adoption_type: string
          price_paid: number | null
          ip_transfer_agreement_signed: boolean
          ip_transfer_signed_at: string | null
          status: string
          resurrected_at: string | null
          resurrection_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          adopter_id: string
          creator_id: string
          adoption_type: string
          price_paid?: number | null
          ip_transfer_agreement_signed?: boolean
          status?: string
          resurrected_at?: string | null
          resurrection_url?: string | null
        }
        Update: {
          adoption_type?: string
          price_paid?: number | null
          ip_transfer_agreement_signed?: boolean
          ip_transfer_signed_at?: string | null
          status?: string
          resurrected_at?: string | null
          resurrection_url?: string | null
        }
        Relationships: []
      }
      adoption_chats: {
        Row: {
          id: string
          adoption_id: string
          sender_id: string
          message_text: string
          created_at: string
        }
        Insert: {
          id?: string
          adoption_id: string
          sender_id: string
          message_text: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          adoption_id: string
          stripe_payment_intent_id: string | null
          amount_cents: number
          currency: string
          status: string
          creator_receives_cents: number | null
          bureau_receives_cents: number | null
          payment_method: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          adoption_id: string
          stripe_payment_intent_id?: string | null
          amount_cents: number
          currency?: string
          status?: string
          creator_receives_cents?: number | null
          bureau_receives_cents?: number | null
          payment_method?: string | null
        }
        Update: {
          stripe_payment_intent_id?: string | null
          status?: string
          completed_at?: string | null
          payment_method?: string | null
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          id: string
          stat_date: string
          new_projects_submitted: number
          new_adoptions: number
          projects_resurrected: number
          death_cause_perfectionism: number
          death_cause_money: number
          death_cause_life: number
          death_cause_scope_creep: number
          death_cause_breakup: number
          death_cause_obsolete: number
          death_cause_interest: number
          death_cause_market: number
          created_at: string
        }
        Insert: {
          stat_date: string
          new_projects_submitted?: number
          new_adoptions?: number
          projects_resurrected?: number
          death_cause_perfectionism?: number
          death_cause_money?: number
          death_cause_life?: number
          death_cause_scope_creep?: number
          death_cause_breakup?: number
          death_cause_obsolete?: number
          death_cause_interest?: number
          death_cause_market?: number
        }
        Update: {
          new_projects_submitted?: number
          new_adoptions?: number
          projects_resurrected?: number
          death_cause_perfectionism?: number
          death_cause_money?: number
          death_cause_life?: number
          death_cause_scope_creep?: number
          death_cause_breakup?: number
          death_cause_obsolete?: number
          death_cause_interest?: number
          death_cause_market?: number
        }
        Relationships: []
      }
      curator_notes: {
        Row: {
          id: string
          project_id: string
          curator_id: string
          content: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          curator_id: string
          content: string
          is_public?: boolean
        }
        Update: {
          content?: string
          is_public?: boolean
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      increment_daily_stat: {
        Args: { p_date: string; p_column: string }
        Returns: undefined
      }
      increment_autopsy_comment_count: {
        Args: { p_autopsy_id: string }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectFile = Database['public']['Tables']['project_files']['Row']
export type Autopsy = Database['public']['Tables']['autopsies']['Row']
export type AutopsyComment = Database['public']['Tables']['autopsy_comments']['Row']
export type Adoption = Database['public']['Tables']['adoptions']['Row']
export type AdoptionChat = Database['public']['Tables']['adoption_chats']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type DailyStats = Database['public']['Tables']['daily_stats']['Row']
export type CuratorNote = Database['public']['Tables']['curator_notes']['Row']

// Extended types with joins
export type ProjectWithProfile = Project & {
  profiles: Profile
  project_files: ProjectFile[]
  autopsies: Autopsy | null
}

export type AdoptionWithDetails = Adoption & {
  projects: Project
  profiles: Profile // adopter
}

export type AutopsyWithComments = Autopsy & {
  autopsy_comments: (AutopsyComment & { profiles: Profile })[]
}

// Form types
export type CauseOfDeath =
  | 'Perfectionism'
  | 'Ran out of money'
  | 'Scope creep'
  | 'Lost interest'
  | 'Life got in the way'
  | 'Team breakup'
  | 'Technology became obsolete'
  | 'Market vanished'
  | 'Other'

export type ProjectType =
  | 'Web App'
  | 'Mobile App'
  | 'Game'
  | 'Hardware'
  | 'Writing'
  | 'Design'
  | 'Music'
  | 'Business'
  | 'Research'
  | 'Other'

export type AdoptionType = 'open_casket' | 'organ_donor' | 'resurrection_rights'

export const CAUSES_OF_DEATH: CauseOfDeath[] = [
  'Perfectionism',
  'Ran out of money',
  'Scope creep',
  'Lost interest',
  'Life got in the way',
  'Team breakup',
  'Technology became obsolete',
  'Market vanished',
  'Other',
]

export const PROJECT_TYPES: ProjectType[] = [
  'Web App',
  'Mobile App',
  'Game',
  'Hardware',
  'Writing',
  'Design',
  'Music',
  'Business',
  'Research',
  'Other',
]

export const ADOPTION_TYPES = [
  {
    value: 'open_casket' as AdoptionType,
    label: 'Open Casket',
    description: 'Free to use, remix, or build upon',
    price: null,
  },
  {
    value: 'organ_donor' as AdoptionType,
    label: 'Organ Donor',
    description: 'Take what you need, give credit',
    price: null,
  },
  {
    value: 'resurrection_rights' as AdoptionType,
    label: 'Resurrection Rights',
    description: 'Exclusive rights to revive the project',
    price: 'custom',
  },
]

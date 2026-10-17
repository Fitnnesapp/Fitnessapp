export type UnitsPreference = 'metric' | 'imperial';

export type ConsentKey = 'consent_health_data' | 'consent_location' | 'consent_marketing';

export type ConsentType = 'health_data' | 'location' | 'marketing';

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  units_preference: UnitsPreference;
  consent_health_data: boolean;
  consent_location: boolean;
  consent_marketing: boolean;
  consent_given_at: string | null;
  consent_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

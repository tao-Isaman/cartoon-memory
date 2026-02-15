export type Gender = 'male' | 'female' | 'other';
export type RelationshipStatus = 'single' | 'dating' | 'married' | 'other';
export type OccasionType = 'valentine' | 'anniversary' | 'birthday' | 'other';

export interface UserProfile {
  id: string;
  userId: string;
  phone: string | null;
  birthday: string | null;
  gender: Gender | null;
  job: string | null;
  relationshipStatus: RelationshipStatus | null;
  occasionType: OccasionType | null;
  profileCreditsClaimed: boolean;
  createdAt: string;
  updatedAt: string;
}

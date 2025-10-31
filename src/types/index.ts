/**
 * Type definitions for Hayda Min
 */

export interface Person {
  id: string;
  name: string;              // English name
  nameAr: string;            // Arabic name
  relationship: string;       // Arabic label (e.g., "ابنتك")
  relationshipEn: string;    // English label (e.g., "your daughter")
  primaryPhoto: string;       // URL to main photo
  photos: string[];          // URLs to additional photos
  spouseId: string | null;   // Reference to spouse
  parentIds: string[];       // References to parents
  childrenIds: string[];     // References to children
  location?: string;         // e.g., "Beirut", "Montreal"
  locationAr?: string;       // Arabic location
  birthday?: string;         // e.g., "1975-05-10"
  favoriteFood?: string;     // e.g., "Kibbeh", "Baklava"
  favoriteFoodAr?: string;   // Arabic favorite food
  facts?: string[];          // Other memorable details (English)
  factsAr?: string[];        // Arabic facts
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  name: string;              // e.g., "Layla's Family"
  rootPersonId: string;
  memberIds: string[];
}

// For navigation state
export interface NavigationState {
  currentPersonId: string;
  breadcrumb: string[];      // Array of person IDs showing navigation path
}

// For hub view - who to display and how
export interface HubView {
  centerPerson: Person;
  spouse: Person | null;
  children: Person[];
  isRootLevel: boolean;
}

// Relationship types in both languages
export type RelationshipType =
  | 'son'
  | 'daughter'
  | 'grandson'
  | 'granddaughter'
  | 'great-grandson'
  | 'great-granddaughter'
  | 'husband'
  | 'wife'
  | 'brother'
  | 'sister';

export interface RelationshipLabel {
  ar: string;
  en: string;
}

export const RELATIONSHIP_LABELS: Record<RelationshipType, RelationshipLabel> = {
  son: { ar: 'ابنك', en: 'your son' },
  daughter: { ar: 'ابنتك', en: 'your daughter' },
  grandson: { ar: 'حفيدك', en: 'your grandson' },
  granddaughter: { ar: 'حفيدتك', en: 'your granddaughter' },
  'great-grandson': { ar: 'حفيد حفيدك', en: 'your great-grandson' },
  'great-granddaughter': { ar: 'حفيدة حفيدتك', en: 'your great-granddaughter' },
  husband: { ar: 'زوجك', en: 'your husband' },
  wife: { ar: 'زوجتك', en: 'your wife' },
  brother: { ar: 'أخوك', en: 'your brother' },
  sister: { ar: 'أختك', en: 'your sister' },
};

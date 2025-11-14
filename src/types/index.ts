/**
 * Type definitions for Hayda Min
 */

export interface Person {
  id: string;
  name: string;              // English name (default)
  nameAr: string;            // Arabic name
  relationship: string;       // English label (default) (e.g., "your daughter")
  relationshipAr: string;    // Arabic label (e.g., "ابنتك")
  primaryPhoto: string;       // URL to main photo
  photoURL?: string;         // Alias for primaryPhoto (for compatibility)
  photos: string[];          // URLs to additional photos
  spouseId: string | null;   // Reference to spouse
  parentIds: string[];       // References to parents
  childrenIds: string[];     // References to children
  birthday?: string;         // ISO date string (e.g., "1975-05-10")
  location?: string;         // English (default) (e.g., "Beirut, Lebanon")
  locationAr?: string;       // Arabic location
  favoriteFood?: string;     // English (default) (e.g., "Kibbeh Nayyeh")
  favoriteFoodAr?: string;   // Arabic favorite food
  about?: string;            // English (default) longer description
  aboutAr?: string;          // Arabic longer description
  facts?: string[];          // English (default) memorable details
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

// Memory feature - family video stories
export interface Memory {
  id: string;
  title: string;              // English title
  titleAr: string;            // Arabic title
  caption?: string;           // English longer description (optional)
  captionAr?: string;         // Arabic longer description (optional)

  // Video source
  videoUrl: string;           // Firebase Storage URL for video file
  thumbnailUrl: string;       // Firebase Storage URL for thumbnail image

  // Metadata
  storytellerId: string;      // Person ID who's telling the story
  dateRecorded: Date;         // When was this video recorded
  durationSeconds: number;    // Video length in seconds
  duration?: number;          // Alias for durationSeconds (for compatibility)
  featured?: boolean;         // Mark as featured (shows full width at top)

  // Media dimensions (prevents layout shift)
  thumbnailAspectRatio?: number;  // width / height of thumbnail (e.g., 1.78 for 16:9)
  videoAspectRatio?: number;      // width / height of video (e.g., 0.56 for 9:16 vertical)

  // Optional metadata for future features
  featuredPeopleIds?: string[]; // Who's mentioned/shown in the video
  people?: string[];          // Alias for featuredPeopleIds (for compatibility)
  tags?: string[];            // For future filtering/search

  createdAt: Date;
  updatedAt: Date;
}

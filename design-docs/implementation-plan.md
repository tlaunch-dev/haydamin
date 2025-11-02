# Implementation Plan for Hayda Min

**Version:** 1.0
**Date:** October 31, 2025
**Status:** In Progress

---

## Overview

This document outlines the implementation plan for **Hayda Min** (هايدا مين؟), a web application to help individuals with dementia recognize and maintain connections with family members.

---

## Tech Stack

### Core Technologies
- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling (with custom theme via @theme directive)
- **Firebase** - Backend services (planned)
  - **Authentication** - Google Sign-In
  - **Firestore** - Database
  - **Storage** - Image hosting
  - **Hosting** - Deployment
- **React Router v6** - Client-side routing
- **React Context API** - State management (LanguageContext)
- **Google Fonts** - Poppins (English) & Tajawal (Arabic)
- **Vite PWA Plugin** - Offline support (planned)
- **React Hook Form** - Form management (planned)

### Key Design Decisions
- **No React Query**: Firebase SDK with custom hooks is sufficient
- **Client-side image compression**: Compress before upload to save storage costs
- **Everyone can edit**: All authenticated users have edit permissions
- **Centralized styling**: No inline styles, all via Tailwind classes
- **View-first approach**: Build with mock data, then add editing features

---

## Project Structure

```
haydamin/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── BackButton.tsx
│   │   ├── FamilyLinkCard.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── PersonCard.tsx
│   │   └── PhotoGallery.tsx
│   ├── pages/            # Page-level components
│   │   ├── FamilyHub.tsx
│   │   └── PersonDetail.tsx
│   ├── context/          # React Context providers
│   │   └── LanguageContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── usePerson.ts
│   │   └── usePeople.ts
│   ├── services/         # Firebase services
│   │   ├── firebase.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── data/             # Mock data for development
│   │   └── mockFamily.ts
│   ├── utils/            # Utility functions
│   │   └── i18n.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles & Tailwind config
├── design-docs/          # Design and planning documents
│   ├── hayda-min-prd.md
│   ├── implementation-plan.md
│   └── personal-page-mock.html
├── .env                  # Environment variables (not in git)
├── .env.example          # Template for env variables
├── .envrc                # direnv config (gcloud config)
├── firebase.json         # Firebase project configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── index.html            # HTML entry point
└── public/               # Static assets
```

---

## Implementation Phases

### ✅ Phase 1: Foundation & Styling System (Completed)
- [x] Initialize Vite + React + TypeScript project
- [x] Install dependencies (Firebase, React Router, Tailwind)
- [x] Configure Tailwind with custom theme
- [x] Add Arabic font (Noto Sans Arabic)
- [x] Set up project folder structure
- [x] Create design tokens (colors, typography, spacing)
- [x] Build base components (Button, Card)

### ✅ Phase 2: Mock Data & Type System (Completed)
- [x] Create TypeScript types for Person model
- [x] Generate mock/placeholder family data
- [x] Create helper functions to query mock data
- [x] Include placeholder images

### ✅ Phase 3: Core Viewing Experience (Completed)
- [x] Build PersonCard component (reusable, styled via props)
- [x] Create hub/tree visualization layout
- [x] Implement PersonDetail page with "هايدا مين؟" button
- [x] Add reveal animation for name/relationship
- [x] Build immediate family thumbnails section
- [x] Display basic facts (location, favorite food)
- [x] Photo gallery component
- [x] Ensure large text and touch targets (60x60px minimum)

### ✅ Phase 4: Navigation & Hub System (Completed)
- [x] Implement person-to-person navigation with mock data
- [x] Back button functionality
- [x] Route structure (/, /hub/:personId, /person/:personId)
- [x] Smooth transitions between views
- [x] Handle root level (grandmother + grandfather centered)
- [x] Clickable family member thumbnails for navigation
- [x] Dynamic hub pages for each family branch
- [x] Intelligent navigation (children → hub, top-level → detail)
- [x] Dynamic page headers with person names

### ✅ Phase 4.5: Internationalization (Completed)
- [x] Language toggle between English and Arabic
- [x] LanguageContext for global language state
- [x] RTL/LTR layout switching based on language
- [x] Dynamic HTML lang and dir attributes
- [x] Font switching (Poppins for English, Tajawal for Arabic)
- [x] Translation utilities (getPersonName, getRelationship, t function)
- [x] Arabic translations for all UI text
- [x] Arabic translations for all mock data
- [x] Profile photo position flip in RTL mode
- [x] Back button icon flip in RTL mode
- [x] Date formatting with locale support

### ✅ Phase 5: Responsive Design & Polish (Completed)
- [x] Optimize layouts for different screen sizes
- [x] Refine touch interactions
- [x] Compact desktop layout (3-4 people per row)
- [x] Single-row scrollable children layout
- [x] Centered, responsive card layouts
- [x] Beautiful animations for PersonDetail reveal
- [x] Staggered fade-in animations
- [x] Remove unnecessary UI elements (section headers, nav arrows)
- [ ] Test on iPad/iPhone with placeholder data
- [ ] **Test with grandmother** - validate UX before building edit mode

### ✅ Phase 6: Firebase Setup & Real Data (Completed)
- [x] Create Firebase project (haydamin)
- [x] Set up Firebase SDK (Auth, Firestore, Storage)
- [x] Configure firebase.json for Firestore and Hosting
- [x] Create React hooks: usePerson, usePeople
- [x] Create Firestore service functions (CRUD operations)
- [x] Create Storage service functions (photo upload/delete)
- [x] Set up .env configuration with Firebase credentials
- [x] Fix naming convention (English as default, Arabic with Ar suffix)
- [x] Write Firestore security rules
- [x] Import real family data to Firestore (36 people)
- [x] Replace mock data usage with Firebase hooks in components
- [x] Add name visibility toggle (eye icon) for recognition practice

### Phase 7: Authentication
- [ ] Implement Google Sign-In
- [ ] Create AuthContext
- [ ] Build simple sign-in UI
- [ ] Protect edit routes (all authenticated users can edit)

### Phase 8: Content Management
- [ ] Create AddPerson form with photo upload
- [ ] Implement client-side image compression
- [ ] Build EditPerson form
- [ ] Relationship selector (Arabic labels)
- [ ] Spouse/parent linking
- [ ] Multi-photo upload
- [ ] Delete functionality
- [ ] Hidden edit mode access (long-press or button)

### Phase 9: PWA & Polish
- [ ] Configure PWA for offline viewing
- [ ] Add loading states and skeletons
- [ ] Lazy load images
- [ ] Error handling and boundaries
- [ ] Final performance optimization
- [ ] Deploy to Firebase Hosting

---

## Data Model

### Person Type
```typescript
interface Person {
  id: string;
  name: string;              // English name (default)
  nameAr: string;            // Arabic name
  relationship: string;       // English label (default) (e.g., "your daughter")
  relationshipAr: string;    // Arabic label (e.g., "ابنتك")
  primaryPhoto: string;       // URL to main photo (Storage URL)
  photos: string[];          // URLs to additional photos (Storage URLs)
  spouseId: string | null;   // Reference to spouse
  parentIds: string[];       // References to parents
  childrenIds: string[];     // References to children
  birthday?: string;         // ISO date string (e.g., "1945-03-15")
  location?: string;         // English (default) (e.g., "Beirut, Lebanon")
  locationAr?: string;       // Arabic location (e.g., "بيروت، لبنان")
  favoriteFood?: string;     // English (default) (e.g., "Kibbeh Nayyeh")
  favoriteFoodAr?: string;   // Arabic favorite food (e.g., "كبة نية")
  facts?: string[];          // English (default) memorable details
  factsAr?: string[];        // Arabic memorable details
  createdAt: Date;
  updatedAt: Date;
}
```

### Firestore Structure
```
/people/{personId}
  - All Person fields
```

### Storage Structure
```
/photos/{personId}/{photoId}.{extension}
```

---

## Key Features

### 1. Hub Navigation
- Display person at center with family orbiting around them
- Root level: Grandmother + Grandfather both centered
- Other levels: Main person centered, spouse adjacent
- Smooth transitions between hubs
- Breadcrumb trail for navigation history
- Back button to return to previous hub

### 2. Person Detail View
- Large, clear photo display
- "هايدا مين؟" (Who is this?) interactive button
- Reveal name and relationship on button press
- Immediate family thumbnails (spouse, children, parents)
- Basic facts section (location, favorite food, memorable details)
- Photo gallery (3-5 additional photos)

### 3. Content Management (Edit Mode)
- Hidden from main UI (long-press or hidden button to access)
- Google authentication required
- All authenticated users can edit
- Add new person with photo, name, relationship
- Upload additional photos to existing people
- Edit person information
- Delete photos

### 4. Accessibility
- Large fonts (minimum 18px body text)
- High contrast ratios (WCAG AA)
- Large touch targets (60x60px minimum)
- Simple navigation patterns
- No complex gestures required
- Arabic language support throughout

### 5. Performance
- Initial load time < 3 seconds
- Hub transitions < 500ms
- Progressive image loading
- Lazy loading for off-screen images
- Offline capability via PWA

---

## Development Workflow

### Testing Strategy
1. **Build with mock data first** - Validate UX before backend
2. **Test with grandmother** - Get real user feedback on viewing experience
3. **Then add edit mode** - Once viewing is validated
4. **Test on real devices** - iPad and iPhone

### Deployment Pipeline
1. Local development with `npm run dev`
2. Build with `npm run build`
3. Preview with `npm run preview`
4. Deploy to Firebase Hosting with `firebase deploy`

---

## Future Enhancements (Not MVP)

These features are explicitly **not** part of the initial version:
- ❌ Favorites/frequently viewed
- ❌ Voice pronunciation of names
- ❌ Video clips
- ❌ Birthday reminders
- ❌ Memory/stories feature
- ❌ Print mode
- ❌ Face recognition
- ❌ Search functionality

---

## Success Criteria

The MVP is considered successful when:
1. ✅ App loads and displays family members with mock data
2. ✅ Grandmother can recognize and interact with person cards
3. ✅ Hub navigation works smoothly between family members
4. ✅ Person detail view clearly shows relationships
5. ✅ App is installable as PWA on iPad
6. ✅ Edit mode allows adding/editing family members
7. ✅ App works offline for viewing

---

## Timeline Estimate

**Total: 7-10 days for full MVP**

- Phase 1: ✅ **Completed** (1 day)
- Phase 2-3: 2-3 days (Types, mock data, UI components)
- Phase 4-5: 2-3 days (Navigation, responsive design, testing)
- Phase 6-7: 1-2 days (Firebase setup, auth)
- Phase 8-9: 2-3 days (Edit mode, PWA, deployment)

---

## Next Steps

1. Create TypeScript types for Person model
2. Generate mock family data (grandmother, children, grandchildren)
3. Build PersonCard component
4. Create initial hub layout
5. Test with grandmother using mock data

---

**Last Updated:** October 31, 2025
**Document Owner:** Development Team

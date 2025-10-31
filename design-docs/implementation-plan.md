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
- **Tailwind CSS** - Styling (with custom theme)
- **Firebase** - Backend services
  - **Authentication** - Google Sign-In
  - **Firestore** - Database
  - **Storage** - Image hosting
  - **Hosting** - Deployment
- **React Router v6** - Client-side routing
- **React Context API** - State management
- **Vite PWA Plugin** - Offline support
- **React Hook Form** - Form management

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
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   ├── pages/            # Page-level components
│   │   ├── Home.tsx
│   │   ├── PersonDetail.tsx
│   │   └── Hub.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePerson.ts
│   │   └── usePeople.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── services/         # Firebase and API services
│   │   ├── firebase.ts
│   │   └── storage.ts
│   ├── context/          # React Context providers
│   │   └── AuthContext.tsx
│   ├── data/             # Mock data for development
│   │   └── mockFamily.ts
│   ├── styles/           # Design tokens and global styles
│   │   ├── tokens.ts
│   │   └── globals.css
│   └── utils/            # Utility functions
│       └── imageCompression.ts
├── design-docs/          # Design and planning documents
│   ├── hayda-min-prd.md
│   └── implementation-plan.md
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
- [x] Route structure (/, /person/:personId)
- [x] Smooth transitions between views
- [x] Handle root level (grandmother + grandfather centered)
- [x] Clickable family member thumbnails for navigation

### Phase 5: Responsive Design & Testing
- [ ] Test on iPad/iPhone with placeholder data
- [ ] Optimize layouts for different screen sizes
- [ ] Refine touch interactions
- [ ] **Test with grandmother** - validate UX before building edit mode

### Phase 6: Firebase Setup & Real Data
- [ ] Create Firebase project
- [ ] Set up Firebase SDK (Auth, Firestore, Storage)
- [ ] Create Firestore security rules
- [ ] Create React hooks: useAuth, usePerson, usePeople
- [ ] Replace mock data with real Firebase queries
- [ ] Set up .env configuration

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

## Design System

### Colors

**Primary** (Blue tones - Trust, clarity)
- Used for primary actions and key UI elements
- Range: 50-900

**Warmth** (Yellow/Gold tones - Comfort, familiarity)
- Used for highlights and secondary actions
- Range: 50-900

**Gray** (Neutral tones)
- Used for text and backgrounds
- Range: 50-900

### Typography

**Font Family**
- Primary: Noto Sans Arabic (for Arabic text)
- Fallback: System fonts

**Font Sizes** (Elderly-friendly sizing)
- Minimum body text: 18px (1.125rem)
- Headings: 24px - 80px
- Names/Relationships: 48px+ for clear visibility

**Font Weights**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing

**Touch Targets**
- Minimum: 60px × 60px
- Comfortable: 72px × 72px

**Container Max Width**
- 1200px for readable content

### Components

All components follow these principles:
- **No inline styles** - All styling via className
- **Props for variants** - size, variant, color passed as props
- **Consistent API** - Similar components have similar props
- **Accessibility** - Large targets, clear focus states, WCAG AA contrast

---

## Data Model

### Person Type
```typescript
interface Person {
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
  favoriteFood?: string;     // e.g., "Kibbeh", "Baklava"
  facts?: string[];          // Other memorable details
  createdAt: Date;
  updatedAt: Date;
}
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

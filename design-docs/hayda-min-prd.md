# Hayda Min - Product Design Document

## Overview

**Hayda Min** (Arabic: "Who is this?") is a web application designed to help individuals with dementia maintain connections with their family members through visual recognition and relationship reminders. The app presents family photos in an intuitive, navigable interface with Arabic language support.

### Target User
- Primary: Elderly individuals with memory loss/dementia (specifically Lebanese, Arabic-speaking)
- Secondary: Family caregivers who assist with navigation and content management

### Core Problem
Dementia patients often struggle to recognize family members and remember relationships. This causes distress for both the patient and family. Traditional photo albums are static and don't provide relationship context.

---

## Product Goals

1. **Recognition Support**: Help users identify family members through photos and clear relationship labels
2. **Ease of Use**: Large touch targets, simple navigation patterns, minimal cognitive load
3. **Emotional Connection**: Facilitate positive interactions through familiar photos
4. **Scalability**: Support growing families (40+ members initially, expanding over time)
5. **Maintainability**: Allow family members to easily add new people and photos

---

## User Flows

### Primary Flow: Browsing Family

1. **Home View (Hub)**
   - User sees grandmother and grandfather at center (equal positioning at root level)
   - Children are displayed in orbit around the couple
   - Helper can tap any person to view details
   - **Note**: At root level only, both spouses are equally centered

2. **Person Detail View**
   - Large photo of selected person
   - Prominent "هايدا مين؟" (Who is this?) button
   - Upon tapping button:
     - Name displayed in Arabic
     - Relationship label in Arabic (e.g., "ابنتك" - your daughter)
     - **Immediate family section**: Small thumbnails of spouse, children, parents with labels
     - **Basic facts**: Location (lives in X), favorite food, other memorable details
     - Gallery of 3-5 additional photos (especially photos with grandmother)

3. **Navigation Between Hubs**
   - If a person has children/spouse, they display a navigation indicator
   - Tapping the indicator navigates to that person's hub
   - Their family (spouse, children) now surrounds them
   - Breadcrumb trail shows navigation path
   - Back button returns to previous hub

### Secondary Flow: Content Management

1. **Authentication**
   - Google Sign-In for all family members
   - No separate admin role - all authenticated users can edit

2. **Edit Mode**
   - Hidden from main UI to prevent accidental activation
   - Access via long-press or hidden gesture
   - Password protection not required (Google auth sufficient)

3. **Adding a Person**
   - Upload photo
   - Enter name (Arabic and English)
   - Select relationship type
   - Choose parent/connect to existing family member
   - Save

4. **Adding Photos to Person**
   - Select existing person
   - Upload additional photos
   - Photos automatically added to their gallery

5. **Editing Person**
   - Update name
   - Change relationship label
   - Rearrange photos
   - Delete photos

---

## Information Architecture

### Data Model

```
Person {
  id: string (unique identifier)
  name: string (English)
  nameAr: string (Arabic)
  relationship: string (Arabic label)
  relationshipEn: string (English label)
  primaryPhoto: string (URL to main display photo)
  photos: array<string> (URLs to additional photos)
  spouseId: string | null (reference to spouse)
  parentIds: array<string> (references to parents)
  childrenIds: array<string> (references to children)
  location: string | null (e.g., "Beirut", "Montreal")
  favoriteFood: string | null (e.g., "Kibbeh", "Baklava")
  facts: array<string> (other memorable details, e.g., "loves gardening", "tells the best jokes")
  createdAt: timestamp
  updatedAt: timestamp
}

Branch {
  id: string
  name: string (e.g., "Layla's Family")
  rootPersonId: string
  memberIds: array<string>
}
```

### Navigation Structure

- **Breadcrumb trail**: Array of person IDs showing navigation path
- **Current hub**: The person currently at center
- **Hub composition**: 
  - **Root level**: Grandmother and grandfather both centered equally
  - **Other levels**: 
    - Center person (main focus, the one navigated to)
    - Spouse adjacent to center (if applicable)
    - Children in orbit around center/couple

---

## Technical Requirements

### Technical Stack

**Frontend Framework**
- **React** (v18+)
- **Reason**: Component-based architecture ideal for hub/person views, rich ecosystem, excellent mobile support

**Hosting & Deployment**
- **Firebase Hosting**
- **Reason**: Integrated with Firebase ecosystem, CDN distribution, automatic HTTPS, single platform for all services, simple deployment via Firebase CLI

**Backend & Database**
- **Firebase**
  - **Firestore**: NoSQL database for person data and relationships
  - **Firebase Storage**: Image hosting with automatic CDN
  - **Firebase Authentication**: Google Sign-In integration
- **Reason**: Minimal backend maintenance, real-time sync, generous free tier, excellent SDK

**State Management**
- **React Context API** or **Zustand**
- **Reason**: Simple state needs (current hub, breadcrumb, selected person), no need for Redux complexity

**Routing**
- **React Router** (v6+)
- **Reason**: Handle navigation between views, deep linking support

**Image Optimization**
- **Sharp** (via Firebase Functions or build-time)
- **Reason**: Compress/resize images for faster loading

**Progressive Web App (PWA)**
- **Workbox** (via Create React App or Vite PWA plugin)
- **Reason**: Install to home screen, offline capability, native app feel

---

## Functional Requirements

### FR-1: Hub Navigation
- Display person at center with spouse positioning based on level:
  - **Root level (grandmother/grandfather)**: Both spouses equally centered
  - **Other levels**: Main person at center, spouse adjacent
- Children and other family members orbit around center
- Show visual indicators for people with navigable families
- Smooth transitions between hubs
- Breadcrumb trail visible at all times
- Back button to return to previous hub

### FR-2: Person Detail View
- Large, clear photo display
- "هايدا مين؟" interactive button
- Reveal name and relationship on button press
- **Immediate family thumbnails**: Display spouse, children, and parents with tap-to-navigate
- **Basic facts section**: Location, favorite food, and other memorable details
- Photo gallery (3-5 additional photos)
- Easy return to hub view

### FR-3: Branch Organization
- Group people by family unit (e.g., "Joseph's family")
- Logical navigation between branches
- Support for 4 generations: great-grandparents → grandchildren

### FR-4: Content Management
- Google authentication for all family members
- Add new person with photo, name, relationship
- Upload additional photos to existing people
- Edit person information
- Edit mode hidden but accessible

### FR-5: Relationship Labels
- Support Arabic relationship terms:
  - ابنك / ابنتك (your son/daughter)
  - حفيدك / حفيدتك (your grandson/granddaughter)
  - حفيد حفيدك (your great-grandson)
  - زوج / زوجة (husband/wife)
- Store both Arabic and English for flexibility

### FR-6: Photo Management
- Upload photos (JPEG, PNG)
- Automatic compression and optimization
- Set primary display photo
- Gallery view with multiple photos per person
- Delete photos

### FR-7: Basic Facts Management
- Add/edit location (free text)
- Add/edit favorite food (free text)
- Add/edit custom facts (array of strings)
- Display in person detail view
- Optional fields (not required)

### FR-8: Multi-device Support
- Responsive design (tablet and phone)
- Touch-optimized interactions
- Large tap targets (minimum 44x44px)
- Works on iPad and iPhone

---

## Non-Functional Requirements

### NFR-1: Performance
- Initial load time < 3 seconds
- Hub transitions < 500ms
- Image loading with progressive enhancement
- Lazy loading for photos not immediately visible

### NFR-2: Accessibility
- Large fonts (minimum 18px for body text)
- High contrast ratios (WCAG AA minimum)
- Large touch targets (60x60px preferred for primary actions)
- Simple navigation patterns
- No complex gestures required

### NFR-3: Reliability
- Offline capability for viewing (PWA with cached photos)
- Auto-save for edits
- Graceful error handling
- No data loss on network interruption

### NFR-4: Security
- Authentication required for edit mode
- Read-only public mode not available (family privacy)
- Secure image storage with Firebase Storage rules
- No public indexing (robots.txt, meta tags)

### NFR-5: Scalability
- Support 100+ people without performance degradation
- Efficient data queries (Firestore indexes)
- Image CDN for fast global delivery
- Pagination for large photo galleries

### NFR-6: Maintainability
- Clear code structure
- Component-based architecture
- Documented data model
- Easy to add new relationship types
- Simple deployment process

---

## Technical Implementation Details

### Firebase Configuration

**Firestore Structure**
```
/people/{personId}
  - name, nameAr, relationship, relationshipEn
  - primaryPhoto, photos[]
  - spouseId, parentIds[], childrenIds[]
  - location, favoriteFood, facts[]
  - createdAt, updatedAt

/branches/{branchId}
  - name, rootPersonId, memberIds[]
```

**Storage Structure**
```
/photos/{personId}/{photoId}.jpg
```

**Security Rules**
- Authentication required for all read/write operations
- All authenticated users can read and write (family trust model)

### Image Handling
1. Upload to Firebase Storage
2. Generate multiple sizes (thumbnail, medium, full)
3. Store URLs in Firestore
4. Use Firebase CDN for delivery
5. Lazy load images outside viewport

### State Management
- **Global State**: Current user, auth status
- **View State**: Current hub, breadcrumb trail, selected person
- **UI State**: Loading indicators, modals, edit mode

### Routing Structure
```
/ → Home (grandmother's hub)
/hub/:personId → Specific person's hub
/person/:personId → Person detail view
/edit → Edit mode (authenticated)
```

---

## Success Metrics

1. **Usage Frequency**: Sessions per week
2. **Navigation Depth**: Average hubs visited per session
3. **Person Recognition**: "هايدا مين؟" button taps (indicates engagement)
4. **Content Growth**: New people/photos added monthly
5. **Multi-user Adoption**: Number of family members who edit content

---

## Future Considerations

### Phase 2 Features (Not MVP)
- Audio pronunciation of names
- Video clips of family members
- Birthday reminders
- "Memory" feature: significant events or stories
- Print mode for physical photo book
- Multi-language support beyond Arabic/English
- Voice interaction ("Who is this?")
- Face recognition to suggest relationships

### Technical Debt to Monitor
- Image storage costs at scale
- Database query optimization with 100+ people
- Offline sync complexity
- Real-time collaboration conflicts

---

## Open Questions

1. **Photo permissions**: How to handle photos with multiple people?
2. **Deletion policy**: Soft delete vs hard delete for people who pass away?
3. **Backup strategy**: Regular exports of family data?
4. **Privacy**: Should there be granular permissions (some family members hidden from certain users)?
5. **Relationship complexity**: How to handle divorced/remarried situations?

---

## Appendix: Arabic Relationship Terms

| English | Arabic | Transliteration |
|---------|--------|-----------------|
| Your son | ابنك | ibnak |
| Your daughter | ابنتك | ibnatak |
| Your grandson | حفيدك | hafeedak |
| Your granddaughter | حفيدتك | hafeedatak |
| Your great-grandson | حفيد حفيدك | hafeed hafeedak |
| Your great-granddaughter | حفيدة حفيدتك | hafeeda hafeedatak |
| Husband of [name] | زوج [name] | zawj |
| Wife of [name] | زوجة [name] | zawja |
| Your brother | أخوك | akhooka |
| Your sister | أختك | okhtak |

---

**Document Version**: 1.0  
**Last Updated**: October 31, 2025  
**Author**: Product Team
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Person } from '../types';

const PEOPLE_COLLECTION = 'people';

// Convert Firestore document to Person type
export const docToPerson = (id: string, data: DocumentData): Person => {
  return {
    id,
    name: data.name || '',
    nameAr: data.nameAr || '',
    relationship: data.relationship || '',
    relationshipAr: data.relationshipAr || '',
    primaryPhoto: data.primaryPhoto || '',
    photos: data.photos || [],
    spouseId: data.spouseId || null,
    parentIds: data.parentIds || [],
    childrenIds: data.childrenIds || [],
    birthday: data.birthday || undefined,
    location: data.location || undefined,
    locationAr: data.locationAr || undefined,
    favoriteFood: data.favoriteFood || undefined,
    favoriteFoodAr: data.favoriteFoodAr || undefined,
    facts: data.facts || undefined,
    factsAr: data.factsAr || undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Convert Person to Firestore document data
export const personToDoc = (person: Omit<Person, 'id'>): DocumentData => {
  return {
    name: person.name,
    nameAr: person.nameAr,
    relationship: person.relationship,
    relationshipAr: person.relationshipAr,
    primaryPhoto: person.primaryPhoto,
    photos: person.photos,
    spouseId: person.spouseId,
    parentIds: person.parentIds,
    childrenIds: person.childrenIds,
    birthday: person.birthday || null,
    location: person.location || null,
    locationAr: person.locationAr || null,
    favoriteFood: person.favoriteFood || null,
    favoriteFoodAr: person.favoriteFoodAr || null,
    facts: person.facts || null,
    factsAr: person.factsAr || null,
    createdAt: Timestamp.fromDate(person.createdAt),
    updatedAt: Timestamp.fromDate(person.updatedAt),
  };
};

// Get all people
export const getAllPeople = async (): Promise<Person[]> => {
  const querySnapshot = await getDocs(collection(db, PEOPLE_COLLECTION));
  return querySnapshot.docs.map((doc) => docToPerson(doc.id, doc.data()));
};

// Get a single person by ID
export const getPersonById = async (id: string): Promise<Person | null> => {
  const docRef = doc(db, PEOPLE_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docToPerson(docSnap.id, docSnap.data());
  }
  return null;
};

// Add a new person
export const addPerson = async (person: Omit<Person, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, PEOPLE_COLLECTION), personToDoc(person));
  return docRef.id;
};

// Update a person
export const updatePerson = async (id: string, updates: Partial<Person>): Promise<void> => {
  const docRef = doc(db, PEOPLE_COLLECTION, id);
  const updateData: any = { ...updates };
  
  // Convert Date objects to Timestamps
  if (updates.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updates.createdAt);
  }
  if (updates.updatedAt) {
    updateData.updatedAt = Timestamp.fromDate(updates.updatedAt);
  }
  
  await updateDoc(docRef, updateData);
};

// Delete a person
export const deletePerson = async (id: string): Promise<void> => {
  const docRef = doc(db, PEOPLE_COLLECTION, id);
  await deleteDoc(docRef);
};

// Update parent's childrenIds array (add new child)
export const updateParentChildrenIds = async (parentId: string, childId: string): Promise<void> => {
  const parentDoc = await getDoc(doc(db, PEOPLE_COLLECTION, parentId));
  if (parentDoc.exists()) {
    const parentData = parentDoc.data();
    const currentChildren = parentData.childrenIds || [];
    
    // Only add if not already present
    if (!currentChildren.includes(childId)) {
      await updateDoc(doc(db, PEOPLE_COLLECTION, parentId), {
        childrenIds: [...currentChildren, childId],
        updatedAt: Timestamp.fromDate(new Date())
      });
    }
  }
};


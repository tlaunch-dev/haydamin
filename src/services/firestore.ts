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
import { Person, Memory } from '../types';

const PEOPLE_COLLECTION = 'people';
const MEMORIES_COLLECTION = 'memories';

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

// ========== MEMORIES COLLECTION ==========

// Convert Firestore document to Memory type
export const docToMemory = (id: string, data: DocumentData): Memory => {
  return {
    id,
    title: data.title || '',
    titleAr: data.titleAr || '',
    caption: data.caption || undefined,
    captionAr: data.captionAr || undefined,
    videoUrl: data.videoUrl || '',
    thumbnailUrl: data.thumbnailUrl || '',
    storytellerId: data.storytellerId || '',
    dateRecorded: data.dateRecorded?.toDate() || new Date(),
    durationSeconds: data.durationSeconds || 0,
    featured: data.featured || false,
    featuredPeopleIds: data.featuredPeopleIds || undefined,
    tags: data.tags || undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Convert Memory to Firestore document data
export const memoryToDoc = (memory: Omit<Memory, 'id'>): DocumentData => {
  return {
    title: memory.title,
    titleAr: memory.titleAr,
    caption: memory.caption || null,
    captionAr: memory.captionAr || null,
    videoUrl: memory.videoUrl,
    thumbnailUrl: memory.thumbnailUrl,
    storytellerId: memory.storytellerId,
    dateRecorded: Timestamp.fromDate(memory.dateRecorded),
    durationSeconds: memory.durationSeconds,
    featured: memory.featured || false,
    featuredPeopleIds: memory.featuredPeopleIds || null,
    tags: memory.tags || null,
    createdAt: Timestamp.fromDate(memory.createdAt),
    updatedAt: Timestamp.fromDate(memory.updatedAt),
  };
};

// Get all memories (sorted by dateRecorded descending - newest first)
export const getAllMemories = async (): Promise<Memory[]> => {
  const querySnapshot = await getDocs(collection(db, MEMORIES_COLLECTION));
  const memories = querySnapshot.docs.map((doc) => docToMemory(doc.id, doc.data()));

  // Sort by dateRecorded, newest first
  return memories.sort((a, b) => b.dateRecorded.getTime() - a.dateRecorded.getTime());
};

// Get a single memory by ID
export const getMemoryById = async (id: string): Promise<Memory | null> => {
  const docRef = doc(db, MEMORIES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docToMemory(docSnap.id, docSnap.data());
  }
  return null;
};

// Add a new memory
export const addMemory = async (memory: Omit<Memory, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, MEMORIES_COLLECTION), memoryToDoc(memory));
  return docRef.id;
};

// Update a memory
export const updateMemory = async (id: string, updates: Partial<Memory>): Promise<void> => {
  const docRef = doc(db, MEMORIES_COLLECTION, id);
  const updateData: any = { ...updates };

  // Convert Date objects to Timestamps
  if (updates.dateRecorded) {
    updateData.dateRecorded = Timestamp.fromDate(updates.dateRecorded);
  }
  if (updates.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updates.createdAt);
  }
  if (updates.updatedAt) {
    updateData.updatedAt = Timestamp.fromDate(updates.updatedAt);
  }

  await updateDoc(docRef, updateData);
};

// Delete a memory
export const deleteMemory = async (id: string): Promise<void> => {
  const docRef = doc(db, MEMORIES_COLLECTION, id);
  await deleteDoc(docRef);
};


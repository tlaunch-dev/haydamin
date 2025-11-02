import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Verify config loaded
if (!firebaseConfig.projectId) {
  console.error('ERROR: Firebase config not loaded! Check your .env file.');
  process.exit(1);
}

console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}`);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface CSVRow {
  id: string;
  name: string;
  nameAr: string;
  relationship: string;
  relationshipAr: string;
  spouseId: string;
  parentId1: string;
  parentId2: string;
  childId1: string;
  childId2: string;
  childId3: string;
  childId4: string;
  childId5: string;
  childId6: string;
  birthday: string;
  location: string;
  locationAr: string;
  favoriteFood: string;
  favoriteFoodAr: string;
  fact1: string;
  fact2: string;
  fact3: string;
  fact1Ar: string;
  fact2Ar: string;
  fact3Ar: string;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as CSVRow);
  }
  
  return rows;
}

function csvRowToPerson(row: CSVRow) {
  // Helper to convert empty string to null
  const emptyToNull = (value: string) => {
    const trimmed = value?.trim();
    return trimmed && trimmed !== '' ? trimmed : null;
  };
  
  // Collect parent IDs
  const parentIds = [row.parentId1, row.parentId2].filter(id => id?.trim() !== '');
  
  // Collect children IDs
  const childrenIds = [
    row.childId1,
    row.childId2,
    row.childId3,
    row.childId4,
    row.childId5,
    row.childId6,
  ].filter(id => id?.trim() !== '');
  
  // Collect facts (English)
  const facts = [row.fact1, row.fact2, row.fact3].filter(fact => fact?.trim() !== '');
  
  // Collect facts (Arabic)
  const factsAr = [row.fact1Ar, row.fact2Ar, row.fact3Ar].filter(fact => fact?.trim() !== '');
  
  const personData: any = {
    name: row.name,
    nameAr: emptyToNull(row.nameAr) || row.name, // Fallback to English name
    relationship: row.relationship,
    relationshipAr: emptyToNull(row.relationshipAr) || row.relationship, // Fallback to English
    primaryPhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&size=400&background=d4a373&color=fff&bold=true&font-size=0.4`,
    photos: [],
    spouseId: emptyToNull(row.spouseId),
    parentIds,
    childrenIds,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Only add optional fields if they have values
  if (emptyToNull(row.birthday)) personData.birthday = emptyToNull(row.birthday);
  if (emptyToNull(row.location)) personData.location = emptyToNull(row.location);
  if (emptyToNull(row.locationAr)) personData.locationAr = emptyToNull(row.locationAr);
  if (emptyToNull(row.favoriteFood)) personData.favoriteFood = emptyToNull(row.favoriteFood);
  if (emptyToNull(row.favoriteFoodAr)) personData.favoriteFoodAr = emptyToNull(row.favoriteFoodAr);
  if (facts.length > 0) personData.facts = facts;
  if (factsAr.length > 0) personData.factsAr = factsAr;
  
  return personData;
}

async function importData(csvFilePath: string) {
  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  
  console.log('Parsing CSV...');
  const rows = parseCSV(csvContent);
  
  console.log(`Found ${rows.length} people to import\n`);
  
  for (const row of rows) {
    try {
      const personData = csvRowToPerson(row);
      const docRef = doc(db, 'people', row.id);
      await setDoc(docRef, personData);
      console.log(`✓ Imported ${row.name} (${row.id})`);
    } catch (error: any) {
      console.error(`✗ Failed to import ${row.name}:`, error.message);
      throw error;
    }
  }
  
  console.log('\n✅ Import complete!');
}

// Run the import
const csvPath = path.join(__dirname, '..', 'data-template.csv');
importData(csvPath).catch(console.error);


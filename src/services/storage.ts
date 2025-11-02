import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a photo to Firebase Storage
 * @param personId - ID of the person
 * @param file - Image file to upload
 * @param photoId - Optional custom photo ID (defaults to timestamp)
 * @returns Download URL of the uploaded photo
 */
export const uploadPhoto = async (
  personId: string,
  file: File,
  photoId?: string
): Promise<string> => {
  const id = photoId || Date.now().toString();
  const extension = file.name.split('.').pop();
  const storageRef = ref(storage, `photos/${personId}/${id}.${extension}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

/**
 * Delete a photo from Firebase Storage
 * @param photoURL - Full download URL of the photo to delete
 */
export const deletePhoto = async (photoURL: string): Promise<void> => {
  const photoRef = ref(storage, photoURL);
  await deleteObject(photoRef);
};

/**
 * Extract storage path from download URL
 * @param downloadURL - Full download URL
 * @returns Storage path
 */
export const getPathFromURL = (downloadURL: string): string => {
  const url = new URL(downloadURL);
  const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
  return pathMatch ? decodeURIComponent(pathMatch[1]) : '';
};


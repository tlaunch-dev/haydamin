import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
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

// ========== VIDEO STORAGE ==========

/**
 * Upload a video to Firebase Storage with progress tracking
 * @param memoryId - ID of the memory
 * @param file - Video file to upload
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Download URL of the uploaded video
 */
export const uploadVideo = async (
  memoryId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const extension = file.name.split('.').pop();
  const storageRef = ref(storage, `memories/${memoryId}/video.${extension}`);

  // Set cache metadata for optimal video caching
  const metadata = {
    cacheControl: 'public, max-age=31536000, immutable', // 1 year - videos don't change
    contentType: file.type,
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calculate progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        // Upload completed successfully
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/**
 * Upload a thumbnail image to Firebase Storage
 * @param memoryId - ID of the memory
 * @param file - Image file (thumbnail) to upload
 * @returns Download URL of the uploaded thumbnail
 */
export const uploadThumbnail = async (
  memoryId: string,
  file: Blob
): Promise<string> => {
  const storageRef = ref(storage, `memories/${memoryId}/thumbnail.jpg`);

  // Set cache metadata for optimal image caching
  const metadata = {
    cacheControl: 'public, max-age=31536000, immutable', // 1 year - thumbnails don't change
    contentType: 'image/jpeg',
  };

  await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
};

/**
 * Delete a video from Firebase Storage
 * @param videoURL - Full download URL of the video to delete
 */
export const deleteVideo = async (videoURL: string): Promise<void> => {
  const videoRef = ref(storage, videoURL);
  await deleteObject(videoRef);
};

/**
 * Delete a thumbnail from Firebase Storage
 * @param thumbnailURL - Full download URL of the thumbnail to delete
 */
export const deleteThumbnail = async (thumbnailURL: string): Promise<void> => {
  const thumbnailRef = ref(storage, thumbnailURL);
  await deleteObject(thumbnailRef);
};

/**
 * Extract thumbnail from video file (first frame at 1 second)
 * @param videoFile - Video file to extract thumbnail from
 * @returns Blob of the thumbnail image (JPEG)
 */
export const extractThumbnailFromVideo = async (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      // Seek to 1 second to avoid black frames at start
      video.currentTime = Math.min(1, video.duration);
    };

    video.onseeked = () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob (JPEG, 90% quality)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
          // Clean up
          URL.revokeObjectURL(video.src);
        },
        'image/jpeg',
        0.9
      );
    };

    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail extraction'));
      URL.revokeObjectURL(video.src);
    };

    // Load video file
    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Get video duration in seconds
 * @param videoFile - Video file to get duration from
 * @returns Duration in seconds
 */
export const getVideoDuration = async (videoFile: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration));
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Refresh a video URL by regenerating download URL from storage reference
 * Useful if cached URL becomes stale or has CORS issues
 * @param videoURL - Current download URL of the video
 * @returns Fresh download URL
 */
export const refreshVideoUrl = async (videoURL: string): Promise<string> => {
  try {
    const path = getPathFromURL(videoURL);
    const videoRef = ref(storage, path);
    const freshUrl = await getDownloadURL(videoRef);
    return freshUrl;
  } catch (error) {
    console.error('Failed to refresh video URL:', error);
    throw error;
  }
};


/**
 * Google Photos Picker API Service
 *
 * This service provides functions to interact with the Google Photos Picker API
 * to allow users to select photos from their Google Photos library.
 *
 * API Documentation: https://developers.google.com/photos/picker/guides/get-started
 */

const PICKER_API_BASE_URL = 'https://photospicker.googleapis.com/v1';

interface PickerSession {
  id: string;
  pickerUri: string;
  pollingConfig: {
    pollInterval: string; // Duration string like "5s"
    timeoutIn: string; // Duration string like "120s"
  };
  mediaItemsSet?: boolean;
}

interface MediaItem {
  id: string;
  createTime?: string;
  type?: string;
  mediaFile: {
    baseUrl: string;
    mimeType: string;
    filename?: string;
    mediaFileMetadata?: {
      width?: number;
      height?: number;
    };
  };
}

interface MediaItemsResponse {
  mediaItems: MediaItem[];
  nextPageToken?: string;
}

/**
 * Creates a new Google Photos Picker session
 * @param accessToken - OAuth access token with photospicker.mediaitems.readonly scope
 * @returns Session data including pickerUri to open
 */
export const createPickerSession = async (accessToken: string): Promise<PickerSession> => {
  console.log('📡 Creating picker session...');
  const response = await fetch(`${PICKER_API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('❌ Session creation failed:', response.status, error);
    throw new Error(error.message || `Failed to create picker session: ${response.statusText}`);
  }

  const session = await response.json();
  console.log('✅ Session created:', {
    id: session.id,
    pickerUri: session.pickerUri,
    timeout: session.pollingConfig?.timeoutIn,
    pollInterval: session.pollingConfig?.pollInterval
  });

  return session;
};

/**
 * Checks the status of a picker session
 * @param sessionId - The session ID to check
 * @param accessToken - OAuth access token
 * @returns Updated session data
 */
export const getSessionStatus = async (
  sessionId: string,
  accessToken: string
): Promise<PickerSession> => {
  const response = await fetch(`${PICKER_API_BASE_URL}/sessions/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to get session status: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Polls the session status until media items are selected or timeout occurs
 * @param sessionId - The session ID to poll
 * @param accessToken - OAuth access token
 * @param onProgress - Optional callback for polling updates
 * @returns Final session data when selection is complete
 */
export const pollSessionUntilComplete = async (
  sessionId: string,
  accessToken: string,
  onProgress?: (elapsed: number, timeout: number) => void
): Promise<PickerSession> => {
  const startTime = Date.now();
  let session = await getSessionStatus(sessionId, accessToken);

  // Parse timeout from duration string (e.g., "120s" -> 120000ms)
  const timeoutMs = parseDuration(session.pollingConfig.timeoutIn);

  while (!session.mediaItemsSet) {
    // Check if we've exceeded the timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= timeoutMs) {
      throw new Error('Picker session timed out. Please try again.');
    }

    // Call progress callback if provided
    if (onProgress) {
      onProgress(elapsed, timeoutMs);
    }

    // Wait for the recommended poll interval
    const pollIntervalMs = parseDuration(session.pollingConfig.pollInterval);
    await sleep(pollIntervalMs);

    // Check session status again
    session = await getSessionStatus(sessionId, accessToken);
  }

  return session;
};

/**
 * Retrieves the media items selected in a session
 * @param sessionId - The session ID
 * @param accessToken - OAuth access token
 * @returns Array of selected media items
 */
export const getMediaItems = async (
  sessionId: string,
  accessToken: string
): Promise<MediaItem[]> => {
  const allItems: MediaItem[] = [];
  let nextPageToken: string | undefined;

  do {
    const url = new URL(`${PICKER_API_BASE_URL}/mediaItems`);
    url.searchParams.append('sessionId', sessionId);
    if (nextPageToken) {
      url.searchParams.append('pageToken', nextPageToken);
    }

    console.log('🔍 Fetching media items from:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ Failed to get media items:', response.status, error);
      throw new Error(error.message || `Failed to get media items: ${response.statusText}`);
    }

    const data: MediaItemsResponse = await response.json();
    console.log('📦 Raw API response:', data);

    if (data.mediaItems) {
      allItems.push(...data.mediaItems);
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return allItems;
};

/**
 * Deletes a picker session (cleanup)
 * @param sessionId - The session ID to delete
 * @param accessToken - OAuth access token
 */
export const deleteSession = async (
  sessionId: string,
  accessToken: string
): Promise<void> => {
  const response = await fetch(`${PICKER_API_BASE_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    // Log error but don't throw - cleanup is best effort
    console.warn(`Failed to delete session ${sessionId}:`, response.statusText);
  }
};

/**
 * Downloads a photo from Google Photos and converts it to a File object
 * @param mediaItem - The media item to download
 * @param accessToken - OAuth access token
 * @param maxDimension - Maximum width/height for the downloaded image
 * @returns File object containing the image data
 */
export const downloadMediaItemAsFile = async (
  mediaItem: MediaItem,
  accessToken: string,
  maxDimension: number = 2048
): Promise<File> => {
  // Construct the download URL with size parameters
  // Format: baseUrl=w{width}-h{height}
  const downloadUrl = `${mediaItem.mediaFile.baseUrl}=w${maxDimension}-h${maxDimension}`;

  const response = await fetch(downloadUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.statusText}`);
  }

  const blob = await response.blob();

  // Create a filename from the mediaItem or use a default
  const extension = getExtensionFromMimeType(mediaItem.mediaFile.mimeType);
  const filename = mediaItem.mediaFile.filename || `google-photo-${mediaItem.id}.${extension}`;

  return new File([blob], filename, { type: mediaItem.mediaFile.mimeType });
};

/**
 * Complete workflow: Create session, open picker, poll for selection, get media items, cleanup
 * @param accessToken - OAuth access token
 * @param onProgress - Optional callback for polling progress
 * @returns Array of File objects for selected photos
 */
export const selectPhotosFromGooglePhotos = async (
  accessToken: string,
  onProgress?: (elapsed: number, timeout: number) => void
): Promise<File[]> => {
  // Create session
  const session = await createPickerSession(accessToken);

  try {
    // Open picker in new window with autoclose
    const pickerUrl = `${session.pickerUri}/autoclose`;
    const pickerWindow = window.open(pickerUrl, '_blank', 'width=800,height=600');

    if (!pickerWindow) {
      throw new Error('Failed to open picker window. Please allow popups for this site.');
    }

    // Poll until selection is complete
    await pollSessionUntilComplete(session.id, accessToken, onProgress);

    // Get selected media items
    const mediaItems = await getMediaItems(session.id, accessToken);

    console.log(`📦 Received ${mediaItems.length} media item(s):`, mediaItems);

    if (mediaItems.length === 0) {
      throw new Error('No photos were selected');
    }

    // Filter to only images
    const imageItems = mediaItems.filter(item => {
      console.log('Item:', {
        id: item.id,
        type: item.type,
        mimeType: item.mediaFile?.mimeType,
        hasBaseUrl: !!item.mediaFile?.baseUrl
      });
      return item.mediaFile && item.mediaFile.mimeType && item.mediaFile.mimeType.startsWith('image/');
    });

    console.log(`📥 Downloading ${imageItems.length} image(s) from ${mediaItems.length} total items...`);

    // Download all selected photos as File objects
    const files = await Promise.all(
      imageItems.map(item => downloadMediaItemAsFile(item, accessToken))
    );

    console.log(`✅ Downloaded ${files.length} file(s)`);

    return files;
  } finally {
    // Always cleanup the session
    await deleteSession(session.id, accessToken).catch(() => {
      // Ignore cleanup errors
    });
  }
};

// Utility functions

/**
 * Parses a duration string like "5s" or "120s" or "1799.961666s" to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^([\d.]+)s$/);
  if (!match) {
    console.warn('Failed to parse duration:', duration, 'using default 5s');
    return 5000; // Default to 5 seconds
  }
  return parseFloat(match[1]) * 1000;
}

/**
 * Simple sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gets file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg'
  };
  return map[mimeType] || 'jpg';
}

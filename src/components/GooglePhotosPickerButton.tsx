import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { selectPhotosFromGooglePhotos } from '../services/googlePhotos';

interface GooglePhotosPickerButtonProps {
  /**
   * Callback when photos are successfully selected
   * @param files - Array of File objects for the selected photos
   */
  onPhotosSelected: (files: File[]) => void;

  /**
   * Whether to allow multiple photo selection
   * Note: The Google Photos Picker API always allows multiple selection,
   * but you can limit to single photo in your onPhotosSelected handler
   */
  multiple?: boolean;

  /**
   * Custom button text (optional)
   */
  buttonText?: {
    en: string;
    ar: string;
  };

  /**
   * Custom CSS classes for the button
   */
  className?: string;

  /**
   * Whether the button should be disabled
   */
  disabled?: boolean;

  /**
   * Current language (for bilingual support)
   */
  language?: 'en' | 'ar';
}

/**
 * Button component to launch Google Photos Picker
 *
 * This component handles:
 * - OAuth authentication with Google Photos scope
 * - Opening the picker interface
 * - Polling for photo selection
 * - Returning selected photos as File objects
 */
export default function GooglePhotosPickerButton({
  onPhotosSelected,
  multiple = true,
  buttonText,
  className,
  disabled = false,
  language = 'en'
}: GooglePhotosPickerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ elapsed: number; timeout: number } | null>(null);

  const defaultButtonText = {
    en: 'Select from Google Photos',
    ar: 'اختر من صور Google'
  };

  const texts = {
    loading: {
      en: 'Opening Google Photos...',
      ar: 'جارٍ فتح صور Google...'
    },
    waiting: {
      en: 'Select photos in popup window',
      ar: 'اختر الصور في النافذة المنبثقة'
    },
    downloading: {
      en: 'Downloading photos...',
      ar: 'جارٍ تنزيل الصور...'
    },
    error: {
      popup: {
        en: 'Please allow popups to use Google Photos',
        ar: 'يرجى السماح بالنوافذ المنبثقة لاستخدام صور Google'
      },
      timeout: {
        en: 'Timed out. Did the popup open? Try again and select photos quickly.',
        ar: 'انتهت المهلة. هل فتحت النافذة؟ حاول مرة أخرى واختر الصور بسرعة.'
      },
      generic: {
        en: 'Failed to load photos. Please try again.',
        ar: 'فشل تحميل الصور. يرجى المحاولة مرة أخرى.'
      }
    }
  };

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      console.log('🔑 Getting Google OAuth token...');
      // Get OAuth token with Google Photos Picker scope
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // Add the Google Photos Picker scope
      provider.addScope('https://www.googleapis.com/auth/photospicker.mediaitems.readonly');

      // Sign in with popup to get the access token
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Failed to get access token from Google');
      }

      console.log('✅ OAuth token received');
      console.log('🪟 Opening Google Photos picker window...');
      console.log('⏳ Please select photos in the popup window');

      // Use the Google Photos Picker API
      const files = await selectPhotosFromGooglePhotos(
        credential.accessToken,
        (elapsed, timeout) => {
          setProgress({ elapsed, timeout });
          console.log(`⏱️ Waiting for selection... ${Math.round(elapsed/1000)}s / ${Math.round(timeout/1000)}s`);
        }
      );

      console.log(`✅ Selected ${files.length} photo(s)`);

      // If not multiple, only return the first file
      const selectedFiles = multiple ? files : [files[0]];

      // Call the callback with the selected photos
      onPhotosSelected(selectedFiles);

      setLoading(false);
      setProgress(null);
    } catch (err: any) {
      console.error('Google Photos Picker error:', err);

      // Handle specific error cases
      if (err.message?.includes('popup')) {
        setError(texts.error.popup[language]);
      } else if (err.message?.includes('timed out') || err.message?.includes('timeout')) {
        setError(texts.error.timeout[language]);
      } else {
        setError(err.message || texts.error.generic[language]);
      }

      setLoading(false);
      setProgress(null);
    }
  };

  const getButtonContent = () => {
    if (loading) {
      if (progress) {
        const progressPercent = Math.min(
          Math.round((progress.elapsed / progress.timeout) * 100),
          100
        );
        return `${texts.waiting[language]} (${progressPercent}%)`;
      }
      return texts.loading[language];
    }

    return (buttonText?.[language] || defaultButtonText[language]);
  };

  const defaultClassName = `
    flex items-center gap-2 px-4 py-2 rounded-lg
    bg-white border-2 border-gray-300
    hover:border-blue-500 hover:bg-blue-50
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    text-gray-700 font-medium
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={className || defaultClassName}
        type="button"
      >
        {loading ? (
          <>
            {/* Loading spinner */}
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{getButtonContent()}</span>
          </>
        ) : (
          <>
            {/* Official Google Photos logo */}
            <img
              src="https://www.gstatic.com/images/branding/product/1x/photos_48dp.png"
              alt="Google Photos"
              className="w-5 h-5"
            />
            <span>{getButtonContent()}</span>
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="text-red-600 text-sm px-2" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

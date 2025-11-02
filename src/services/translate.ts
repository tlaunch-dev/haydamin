/**
 * Google Cloud Translation API Service
 * 
 * Uses Google Cloud Translation API v2 to translate text between English and Arabic
 */

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

export interface TranslateOptions {
  text: string;
  targetLanguage: 'en' | 'ar';
  sourceLanguage?: 'en' | 'ar';
}

/**
 * Translate text using Google Cloud Translation API
 * @param text - The text to translate
 * @param targetLanguage - Target language code ('en' or 'ar')
 * @param sourceLanguage - Source language code (optional, auto-detect if not provided)
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLanguage: 'en' | 'ar',
  sourceLanguage?: 'en' | 'ar'
): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }

  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('Google Translate API key is not configured. Please add VITE_GOOGLE_TRANSLATE_API_KEY to your .env file.');
  }

  try {
    const params = new URLSearchParams({
      key: GOOGLE_TRANSLATE_API_KEY,
      q: text,
      target: targetLanguage,
      format: 'text',
    });

    if (sourceLanguage) {
      params.append('source', sourceLanguage);
    }

    const response = await fetch(`${TRANSLATE_API_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Translation API error:', error);
      throw new Error(`Translation failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;
    
    return translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

/**
 * Translate English to Arabic
 */
export async function translateToArabic(text: string): Promise<string> {
  return translateText(text, 'ar', 'en');
}

/**
 * Translate Arabic to English
 */
export async function translateToEnglish(text: string): Promise<string> {
  return translateText(text, 'en', 'ar');
}


import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Film } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Person, Memory } from '../types';
import { addMemory, updateMemory } from '../services/firestore';
import {
  uploadVideo,
  uploadThumbnail,
  extractThumbnailFromVideo,
  getVideoDuration,
} from '../services/storage';

interface MemoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  memory?: Memory; // If provided, we're in edit mode
  onSuccess?: () => void;
}

const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300MB in bytes

// Helper to calculate video aspect ratio
const getVideoAspectRatio = (videoFile: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const aspectRatio = video.videoWidth / video.videoHeight;
      resolve(aspectRatio);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

// Helper to calculate thumbnail aspect ratio
const getThumbnailAspectRatio = (thumbnailBlob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const aspectRatio = img.width / img.height;
      resolve(aspectRatio);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load thumbnail'));
    };

    img.src = URL.createObjectURL(thumbnailBlob);
  });
};

export function MemoryUploadModal({ isOpen, onClose, people, memory, onSuccess }: MemoryUploadModalProps) {
  const { language } = useLanguage();
  const isEditMode = !!memory;

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

  // Form fields
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [storytellerId, setStorytellerId] = useState('');
  const [dateRecorded, setDateRecorded] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'uploading-video' | 'uploading-thumbnail' | 'saving'>('uploading-video');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form fields when in edit mode
  useEffect(() => {
    if (isOpen && isEditMode && memory) {
      setTitle(memory.title);
      setCaption(memory.caption || '');
      setStorytellerId(memory.storytellerId);
      setDateRecorded(memory.dateRecorded.toISOString().split('T')[0]);
      setThumbnailUrl(memory.thumbnailUrl);
    } else if (isOpen && !isEditMode) {
      resetForm();
    }
  }, [isOpen, isEditMode, memory]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setVideoFile(null);
    setThumbnailBlob(null);
    setThumbnailUrl('');
    setTitle('');
    setCaption('');
    setStorytellerId('');
    setDateRecorded('');
    setIsUploading(false);
    setUploadProgress(0);
    setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      setError(language === 'ar' ? 'يرجى اختيار ملف فيديو (MP4, MOV, AVI)' : 'Please select a video file (MP4, MOV, AVI)');
      return;
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      setError(
        language === 'ar'
          ? 'حجم الملف كبير جداً. الحد الأقصى 300MB'
          : 'File size too large. Maximum 300MB'
      );
      return;
    }

    setError('');
    setVideoFile(file);

    // Set default date from file metadata
    const fileDate = new Date(file.lastModified);
    setDateRecorded(fileDate.toISOString().split('T')[0]);

    // Extract thumbnail
    try {
      const thumbnail = await extractThumbnailFromVideo(file);
      setThumbnailBlob(thumbnail);
      const thumbUrl = URL.createObjectURL(thumbnail);
      setThumbnailUrl(thumbUrl);
    } catch (err) {
      console.error('Error extracting thumbnail:', err);
      setError(language === 'ar' ? 'فشل استخراج الصورة المصغرة' : 'Failed to extract thumbnail');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isEditMode && (!videoFile || !thumbnailBlob)) {
      setError(language === 'ar' ? 'يرجى اختيار ملف فيديو' : 'Please select a video file');
      return;
    }

    if (!title.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال العنوان' : 'Please enter title');
      return;
    }

    if (!storytellerId) {
      setError(language === 'ar' ? 'يرجى اختيار الراوي' : 'Please select storyteller');
      return;
    }

    if (!dateRecorded) {
      setError(language === 'ar' ? 'يرجى اختيار التاريخ' : 'Please select date');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const recordedDate = new Date(dateRecorded);

      if (isEditMode && memory) {
        // Edit mode: Only update metadata
        setCurrentStep('saving');
        await updateMemory(memory.id, {
          title: title.trim(),
          titleAr: title.trim(), // Use English as fallback for Arabic
          caption: caption.trim() || undefined,
          captionAr: caption.trim() || undefined, // Use English as fallback for Arabic
          storytellerId,
          dateRecorded: recordedDate,
          updatedAt: new Date(),
        });
      } else {
        // Create mode: Upload video and thumbnail, then save
        const memoryId = `memory-${Date.now()}`;

        // Step 1: Upload video
        setCurrentStep('uploading-video');
        const videoUrl = await uploadVideo(memoryId, videoFile!, (progress) => {
          setUploadProgress(progress);
        });

        // Step 2: Upload thumbnail
        setCurrentStep('uploading-thumbnail');
        setUploadProgress(0);
        const thumbnailDownloadUrl = await uploadThumbnail(memoryId, thumbnailBlob!);

        // Step 3: Get video duration
        const duration = await getVideoDuration(videoFile!);

        // Step 3.5: Calculate aspect ratios
        const videoAspectRatio = await getVideoAspectRatio(videoFile!);
        const thumbnailAspectRatio = await getThumbnailAspectRatio(thumbnailBlob!);

        // Step 4: Save to Firestore
        setCurrentStep('saving');
        await addMemory({
          title: title.trim(),
          titleAr: title.trim(), // Use English as fallback for Arabic
          caption: caption.trim() || undefined,
          captionAr: caption.trim() || undefined, // Use English as fallback for Arabic
          videoUrl,
          thumbnailUrl: thumbnailDownloadUrl,
          storytellerId,
          dateRecorded: recordedDate,
          durationSeconds: duration,
          videoAspectRatio,
          thumbnailAspectRatio,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Success!
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving memory:', err);
      setError(
        language === 'ar'
          ? 'فشل حفظ الذكرى. يرجى المحاولة مرة أخرى'
          : 'Failed to save memory. Please try again'
      );
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getStepMessage = () => {
    switch (currentStep) {
      case 'uploading-video':
        return language === 'ar' ? 'جاري تحميل الفيديو...' : 'Uploading video...';
      case 'uploading-thumbnail':
        return language === 'ar' ? 'جاري تحميل الصورة المصغرة...' : 'Uploading thumbnail...';
      case 'saving':
        return language === 'ar' ? 'جاري الحفظ...' : 'Saving...';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-text/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-3xl shadow-2xl"
        >
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-text">
                {isEditMode
                  ? language === 'ar'
                    ? 'تعديل الذكرى'
                    : 'Edit Memory'
                  : language === 'ar'
                  ? 'إضافة ذكرية جديدة'
                  : 'Add New Memory'}
              </h2>
              {!isUploading && (
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-card hover:bg-card/80 flex items-center justify-center transition-colors"
                  aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X className="w-5 h-5 text-text" />
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
                {error}
              </div>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text font-medium">{getStepMessage()}</span>
                  {currentStep === 'uploading-video' && (
                    <span className="text-accent font-bold">{uploadProgress}%</span>
                  )}
                </div>
                {currentStep === 'uploading-video' && (
                  <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                {(currentStep === 'uploading-thumbnail' || currentStep === 'saving') && (
                  <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent"
                      animate={{ x: ['0%', '100%'] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '30%' }}
                    />
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Video Upload (only in create mode) or Video Preview (in edit mode) */}
              {!isEditMode ? (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    {language === 'ar' ? 'ملف الفيديو' : 'Video File'} *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                  />
                  {!videoFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full min-h-[200px] border-2 border-dashed border-accent/30 rounded-2xl bg-card hover:bg-card/80 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <Upload className="w-12 h-12 text-accent" />
                      <span className="text-lg text-text">
                        {language === 'ar' ? 'اضغط لتحميل فيديو' : 'Click to upload video'}
                      </span>
                      <span className="text-sm text-text/70">
                        MP4, MOV, AVI • {language === 'ar' ? 'حد أقصى' : 'Max'} 300MB
                      </span>
                    </button>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-card p-4">
                      <div className="flex items-center gap-4">
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt="Thumbnail"
                            className="w-32 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-text/10 rounded-xl flex items-center justify-center">
                            <Film className="w-8 h-8 text-accent" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-text font-medium truncate">{videoFile.name}</p>
                          <p className="text-sm text-text/70">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        {!isUploading && (
                          <button
                            type="button"
                            onClick={() => {
                              setVideoFile(null);
                              setThumbnailBlob(null);
                              setThumbnailUrl('');
                            }}
                            className="text-text/70 hover:text-text"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    {language === 'ar' ? 'الفيديو' : 'Video'}
                  </label>
                  <div className="relative rounded-2xl overflow-hidden bg-card p-4">
                    <div className="flex items-center gap-4">
                      {thumbnailUrl && (
                        <img
                          src={thumbnailUrl}
                          alt="Video thumbnail"
                          className="w-32 h-20 object-cover rounded-xl"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-text/70 text-sm">
                          {language === 'ar'
                            ? 'لا يمكن تعديل الفيديو'
                            : 'Video cannot be changed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text mb-2">
                  {language === 'ar' ? 'العنوان' : 'Title'} *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  placeholder="Grandpa's immigration story"
                  className="w-full px-4 py-3 rounded-xl bg-card border border-card text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                  required
                />
              </div>

              {/* Caption */}
              <div>
                <label htmlFor="caption" className="block text-sm font-medium text-text mb-2">
                  {language === 'ar' ? 'الوصف' : 'Caption'}
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={isUploading}
                  placeholder="Optional longer description..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-card text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 resize-none"
                />
              </div>

              {/* Storyteller */}
              <div>
                <label htmlFor="storyteller" className="block text-sm font-medium text-text mb-2">
                  {language === 'ar' ? 'من يروي هذه القصة؟' : "Who's telling this story?"} *
                </label>
                <select
                  id="storyteller"
                  value={storytellerId}
                  onChange={(e) => setStorytellerId(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-card text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                  required
                >
                  <option value="">
                    {language === 'ar' ? 'اختر شخصاً' : 'Select a person'}
                  </option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {language === 'ar' ? person.nameAr : person.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Recorded */}
              <div>
                <label htmlFor="dateRecorded" className="block text-sm font-medium text-text mb-2">
                  {language === 'ar' ? 'متى تم تسجيل هذا؟' : 'When was this recorded?'} *
                </label>
                <input
                  id="dateRecorded"
                  type="date"
                  value={dateRecorded}
                  onChange={(e) => setDateRecorded(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-card text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 rounded-xl bg-card text-text font-medium hover:bg-card/80 transition-colors disabled:opacity-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!isEditMode && !videoFile)}
                  className="flex-1 px-6 py-3 rounded-xl bg-accent text-accent-text font-medium hover:bg-accent-warm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading
                    ? isEditMode
                      ? language === 'ar'
                        ? 'جاري الحفظ...'
                        : 'Saving...'
                      : language === 'ar'
                      ? 'جاري التحميل...'
                      : 'Uploading...'
                    : isEditMode
                    ? language === 'ar'
                      ? 'تحديث الذكرى'
                      : 'Update Memory'
                    : language === 'ar'
                    ? 'حفظ الذكرى'
                    : 'Save Memory'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

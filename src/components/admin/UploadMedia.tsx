'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { addMedia } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Sleep Meditation','Relaxation','Focus Music','Healing Sounds',
  'Nature Sounds','Guided Meditation','Videos','Other',
];

interface Props { onSuccess: () => void; }

export default function UploadMedia({ onSuccess }: Props) {
  const { user } = useAuth();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [mediaProgress, setMediaProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');

  const onDropMedia = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setMediaFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }, [title]);

  const onDropThumb = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps: getMediaProps, getInputProps: getMediaInput, isDragActive: mediaDrag } =
    useDropzone({ onDrop: onDropMedia, accept: { 'audio/*': [], 'video/*': [] }, maxFiles: 1 });

  const { getRootProps: getThumbProps, getInputProps: getThumbInput, isDragActive: thumbDrag } =
    useDropzone({ onDrop: onDropThumb, accept: { 'image/*': [] }, maxFiles: 1 });

  const handleUpload = async () => {
    if (!mediaFile || !title.trim() || !user) {
      toast.error('Please add a file and a title.');
      return;
    }
    setUploading(true);
    setMediaProgress(0);
    setThumbProgress(0);

    try {
      const isVideo = mediaFile.type.startsWith('video/');
      let thumbUrl = '';

      if (thumbFile) {
        setUploadStage('Uploading thumbnail...');
        const thumbResult = await uploadToCloudinary(thumbFile, setThumbProgress, 'image');
        thumbUrl = thumbResult.secureUrl;
      }

      setUploadStage(isVideo ? 'Uploading video... (may take a while)' : 'Uploading audio...');
      const mediaResult = await uploadToCloudinary(mediaFile, setMediaProgress, 'auto');
      const mediaUrl = mediaResult.secureUrl;

      const duration = await new Promise<number>((resolve) => {
        const el = document.createElement(isVideo ? 'video' : 'audio');
        el.preload = 'metadata';
        el.src = URL.createObjectURL(mediaFile);
        el.onloadedmetadata = () => resolve(el.duration || 0);
        el.onerror = () => resolve(mediaResult.duration || 0);
        setTimeout(() => resolve(mediaResult.duration || 0), 5000);
      });

      setUploadStage('Saving to library...');
      await addMedia({
        title: title.trim(),
        description: description.trim(),
        type: isVideo ? 'video' : 'audio',
        category,
        url: mediaUrl,
        thumbnailUrl: thumbUrl,
        duration,
        fileSize: mediaFile.size,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
        playCount: 0,
        tags: [],
      });

      toast.success('Media uploaded successfully!');
      setMediaFile(null);
      setThumbFile(null);
      setThumbPreview('');
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setMediaProgress(0);
      setThumbProgress(0);
      setUploadStage('');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadStage('');
    }
  };

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-star">Upload Media</h2>
        <p className="text-sm text-twilight mt-1">Files stored securely on Cloudinary (25 GB free)</p>
      </div>

      {/* Media dropzone */}
      <div
        {...getMediaProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          mediaDrag
            ? 'border-aurora bg-aurora/5'
            : mediaFile
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-dusk hover:border-twilight hover:bg-mist/30'
        }`}
      >
        <input {...getMediaInput()} />
        {mediaFile ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-left min-w-0">
              <p className="text-star text-sm font-medium truncate">{mediaFile.name}</p>
              <p className="text-twilight text-xs">
                {formatSize(mediaFile.size)} · {mediaFile.type.startsWith('video/') ? 'Video' : 'Audio'}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setMediaFile(null); }}
              className="ml-4 text-twilight hover:text-star transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 mx-auto mb-3 text-dusk" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-star font-medium">Drag & drop audio or video</p>
            <p className="text-twilight text-sm mt-1">or click to browse your files</p>
            <p className="text-dusk text-xs mt-2">MP3 · WAV · M4A · MP4 · MOV · WebM</p>
          </>
        )}
      </div>

      {/* Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-aurora">
              <div className="w-3 h-3 border-2 border-aurora border-t-transparent rounded-full animate-spin flex-shrink-0" />
              {uploadStage}
            </div>
            {thumbFile && thumbProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-twilight">
                  <span>Thumbnail</span><span>{thumbProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${thumbProgress}%` }} />
                </div>
              </div>
            )}
            {mediaProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-twilight">
                  <span>Media file</span>
                  <span className="text-aurora font-medium">{mediaProgress}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    animate={{ width: `${mediaProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
            {mediaProgress === 0 && uploadStage.includes('video') && (
              <p className="text-xs text-twilight">
                Large video files can take several minutes. Keep this tab open.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm text-twilight">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter media title"
            disabled={uploading}
            className="input-field disabled:opacity-50"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm text-twilight">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this session…"
            rows={3}
            disabled={uploading}
            className="input-field resize-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-twilight">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={uploading}
            className="input-field disabled:opacity-50"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-twilight">Thumbnail (optional)</label>
          <div
            {...getThumbProps()}
            className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all text-center ${
              thumbDrag ? 'border-aurora bg-aurora/5' : 'border-dusk hover:border-twilight'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getThumbInput()} />
            {thumbPreview ? (
              <div className="relative">
                <img src={thumbPreview} alt="Thumbnail" className="w-full h-20 object-cover rounded-lg" />
                <button
                  onClick={(e) => { e.stopPropagation(); setThumbFile(null); setThumbPreview(''); }}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <p className="text-twilight text-sm py-2">Add cover image</p>
            )}
          </div>
        </div>
      </div>

      <motion.button
        onClick={handleUpload}
        disabled={uploading || !mediaFile || !title.trim()}
        whileTap={{ scale: 0.98 }}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {uploadStage || 'Uploading…'}
          </>
        ) : 'Upload to Sanctuary'}
      </motion.button>
    </div>
  );
}
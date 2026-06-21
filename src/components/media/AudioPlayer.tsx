'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { addMedia } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Walking Meditation', 'Kaleidoscope', 'Lectures', 'Guided Meditations',
];

type Tab = 'audio' | 'video' | 'long';

interface Props { onSuccess: () => void; }

export default function UploadMedia({ onSuccess }: Props) {
  const { user } = useAuth();

  // File state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [longFile, setLongFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');

  // Progress state
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [longProgress, setLongProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [activeTab, setActiveTab] = useState<Tab>('audio');
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');

  // ── Dropzone callbacks ─────────────────────────────────────────────────────

  const onDropAudio = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setAudioFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }, [title]);

  const onDropVideo = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setVideoFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }, [title]);

  const onDropLong = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLongFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }, [title]);

  const onDropThumb = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }, []);

  // ── Dropzone hooks ─────────────────────────────────────────────────────────

  const { getRootProps: getAudioProps, getInputProps: getAudioInput, isDragActive: audioDrag } =
    useDropzone({
      onDrop: onDropAudio,
      accept: {
        'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
      },
      maxFiles: 1,
    });

  const { getRootProps: getVideoProps, getInputProps: getVideoInput, isDragActive: videoDrag } =
    useDropzone({
      onDrop: onDropVideo,
      accept: {
        'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv'],
      },
      maxFiles: 1,
    });

  const { getRootProps: getLongProps, getInputProps: getLongInput, isDragActive: longDrag } =
    useDropzone({
      onDrop: onDropLong,
      accept: {
        'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'],
      },
      maxFiles: 1,
    });

  const { getRootProps: getThumbProps, getInputProps: getThumbInput, isDragActive: thumbDrag } =
    useDropzone({
      onDrop: onDropThumb,
      accept: { 'image/*': [] },
      maxFiles: 1,
    });

  // ── Upload handler ─────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const mediaFile =
      activeTab === 'audio' ? audioFile :
      activeTab === 'video' ? videoFile :
      longFile;

    if (!mediaFile || !title.trim() || !user) {
      toast.error('Please add a file and a title.');
      return;
    }
    setUploading(true);

    try {
      // 1. Upload thumbnail (all tabs support it)
      let thumbUrl = '';
      if (thumbFile) {
        setUploadStage('Uploading thumbnail…');
        const r = await uploadToCloudinary(thumbFile, setThumbProgress, 'image');
        thumbUrl = r.secureUrl;
      }

      let mediaUrl = '';
      let duration = 0;
      let fileSize = mediaFile.size;

      if (activeTab === 'long') {
       

      } else {
        // ── Cloudinary path (audio / short video) ─────────────────────────
        const isVideo = activeTab === 'video';
        setUploadStage(isVideo ? 'Uploading video…' : 'Uploading audio…');
        const setProgress = isVideo ? setVideoProgress : setAudioProgress;
        const mediaResult = await uploadToCloudinary(mediaFile, setProgress, 'auto');
        mediaUrl = mediaResult.secureUrl;

        // Get duration from browser
        duration = await new Promise<number>((resolve) => {
          const el = document.createElement(isVideo ? 'video' : 'audio');
          el.preload = 'metadata';
          el.src = URL.createObjectURL(mediaFile);
          el.onloadedmetadata = () => resolve(el.duration || 0);
          el.onerror = () => resolve(mediaResult.duration || 0);
          setTimeout(() => resolve(mediaResult.duration || 0), 5000);
        });
      }

      // 2. Save to Firestore
      setUploadStage('Saving to library…');
      await addMedia({
        title: title.trim(),
        description: description.trim(),
        // Long videos are stored as 'video' type but URL is an embed URL
        type: activeTab === 'audio' ? 'audio' : 'video',
        category,
        url: mediaUrl,
        thumbnailUrl: thumbUrl,
        duration,
        fileSize,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
        playCount: 0,
        tags: activeTab === 'long' ? ['bunny', 'long-video'] : [],
      });

      toast.success('Uploaded successfully! 🎉');

      // Reset all state
      setAudioFile(null);
      setVideoFile(null);
      setLongFile(null);
      setThumbFile(null);
      setThumbPreview('');
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setAudioProgress(0);
      setVideoProgress(0);
      setLongProgress(0);
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  const currentFile = activeTab === 'audio' ? audioFile : activeTab === 'video' ? videoFile : longFile;
  const currentProgress = activeTab === 'audio' ? audioProgress : activeTab === 'video' ? videoProgress : longProgress;

  const tabs: { id: Tab; label: string; emoji: string; desc: string }[] = [
    { id: 'audio', label: 'Audio', emoji: '🎵', desc: 'MP3 · WAV · M4A · AAC · OGG · FLAC' },
    { id: 'video', label: 'Video', emoji: '🎥', desc: 'MP4 · MOV · WebM · AVI · MKV (≤ ~2 GB)' },
    { id: 'long', label: 'Long Video', emoji: '🎬', desc: 'MP4 · MOV · WebM · AVI · MKV · M4V (via Bunny Stream, no size limit)' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-star">Upload Media</h2>
        <p className="text-sm text-twilight mt-1">
          Audio &amp; short video → Cloudinary (25 GB free) · Long video → Bunny Stream
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex bg-ink border border-dusk rounded-xl p-1 gap-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-aurora text-white shadow-md' : 'text-twilight hover:text-moon'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Bunny notice for Long Video */}
      <AnimatePresence>
        {activeTab === 'long' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-cosmos/10 border border-cosmos/30"
          >
            <span className="text-cosmos text-lg flex-shrink-0">🐰</span>
            <div className="text-sm">
              <p className="text-cosmos font-medium">Bunny Stream upload</p>
              <p className="text-twilight mt-0.5">
                Your video will be uploaded to Bunny Stream and played back via an embedded player.
                Make sure <code className="text-moon bg-ink px-1 rounded">NEXT_PUBLIC_BUNNY_LIBRARY_ID</code> and{' '}
                <code className="text-moon bg-ink px-1 rounded">NEXT_PUBLIC_BUNNY_API_KEY</code> are
                set in your <code className="text-moon bg-ink px-1 rounded">.env.local</code>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropzone — Audio */}
      {activeTab === 'audio' && (
        <Dropzone
          getRootProps={getAudioProps}
          getInputProps={getAudioInput}
          isDragActive={audioDrag}
          file={audioFile}
          onClear={() => setAudioFile(null)}
          emoji="🎵"
          label="Drag & drop audio file"
          hint="MP3 · WAV · M4A · AAC · OGG · FLAC"
          formatSize={formatSize}
        />
      )}

      {/* Dropzone — Short Video */}
      {activeTab === 'video' && (
        <Dropzone
          getRootProps={getVideoProps}
          getInputProps={getVideoInput}
          isDragActive={videoDrag}
          file={videoFile}
          onClear={() => setVideoFile(null)}
          emoji="🎥"
          label="Drag & drop video file"
          hint="MP4 · MOV · WebM · AVI · MKV"
          formatSize={formatSize}
        />
      )}

      {/* Dropzone — Long Video (Bunny) */}
      {activeTab === 'long' && (
        <Dropzone
          getRootProps={getLongProps}
          getInputProps={getLongInput}
          isDragActive={longDrag}
          file={longFile}
          onClear={() => setLongFile(null)}
          emoji="🎬"
          label="Drag & drop long video file"
          hint="MP4 · MOV · WebM · AVI · MKV · M4V — no size limit via Bunny Stream"
          formatSize={formatSize}
          accentColor="cosmos"
        />
      )}

      {/* Upload progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-aurora">
              <div className="w-3 h-3 border-2 border-aurora border-t-transparent rounded-full animate-spin flex-shrink-0" />
              {uploadStage}
            </div>
            {thumbFile && thumbProgress > 0 && (
              <ProgressBar label="Thumbnail" value={thumbProgress} />
            )}
            {currentProgress > 0 && (
              <ProgressBar
                label={activeTab === 'audio' ? 'Audio' : activeTab === 'video' ? 'Video' : 'Long Video (Bunny)'}
                value={currentProgress}
                accent={activeTab === 'long' ? 'cosmos' : 'aurora'}
              />
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

        {/* Thumbnail — shown for all tabs */}
        <div className="space-y-1">
          <label className="text-sm text-twilight">
            Thumbnail {activeTab === 'long' ? '(recommended)' : '(optional)'}
          </label>
          <div
            {...getThumbProps()}
            className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all text-center ${
              thumbDrag ? 'border-aurora bg-aurora/5' : 'border-dusk hover:border-twilight'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getThumbInput()} />
            {thumbPreview ? (
              <div className="relative">
                <img
                  src={thumbPreview}
                  alt="Thumbnail"
                  className="w-full h-20 object-cover rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setThumbFile(null);
                    setThumbPreview('');
                  }}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <p className="text-twilight text-sm py-2">
                {activeTab === 'long' ? '📸 Add cover image (shown in library)' : 'Add cover image'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleUpload}
        disabled={uploading || !currentFile || !title.trim()}
        whileTap={{ scale: 0.98 }}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {uploadStage || 'Uploading…'}
          </>
        ) : (
          activeTab === 'audio'
            ? 'Upload Audio to Sanctuary'
            : activeTab === 'video'
            ? 'Upload Video to Sanctuary'
            : '🎬 Upload Long Video via Bunny Stream'
        )}
      </motion.button>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface DropzoneProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  file: File | null;
  onClear: () => void;
  emoji: string;
  label: string;
  hint: string;
  formatSize: (b: number) => string;
  accentColor?: 'aurora' | 'cosmos';
}

function Dropzone({
  getRootProps, getInputProps, isDragActive, file, onClear,
  emoji, label, hint, formatSize, accentColor = 'aurora',
}: DropzoneProps) {
  const accent = accentColor === 'cosmos' ? 'border-cosmos bg-cosmos/5' : 'border-aurora bg-aurora/5';
  const success = accentColor === 'cosmos' ? 'border-cosmos/50 bg-cosmos/5' : 'border-green-500/50 bg-green-500/5';

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
        isDragActive ? accent :
        file ? success :
        'border-dusk hover:border-twilight hover:bg-mist/30'
      }`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-left min-w-0">
            <p className="text-star text-sm font-medium truncate">{file.name}</p>
            <p className="text-twilight text-xs">{formatSize(file.size)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="ml-4 text-twilight hover:text-star"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div className="text-4xl mb-3">{emoji}</div>
          <p className="text-star font-medium">{label}</p>
          <p className="text-twilight text-sm mt-1">or click to browse</p>
          <p className="text-dusk text-xs mt-2">{hint}</p>
        </>
      )}
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  accent?: 'aurora' | 'cosmos';
}

function ProgressBar({ label, value, accent = 'aurora' }: ProgressBarProps) {
  const fill = accent === 'cosmos'
    ? 'bg-gradient-to-r from-cosmos to-cosmos-light'
    : 'bg-gradient-to-r from-nebula to-aurora';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-twilight">
        <span>{label}</span>
        <span className={accent === 'cosmos' ? 'text-cosmos font-medium' : 'text-aurora font-medium'}>
          {value}%
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className={`h-full rounded-full transition-all duration-100 ${fill}`}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
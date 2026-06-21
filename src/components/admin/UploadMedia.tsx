'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { parseYouTubeUrl } from '@/lib/youtube';
import { addMedia } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Walking Meditation', 'Kaleidoscope', 'Lectures', 'Guided Meditations',
];

interface Props { onSuccess: () => void; }

type Tab = 'audio' | 'video' | 'youtube';

export default function UploadMedia({ onSuccess }: Props) {
  const { user } = useAuth();

  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);

  // Video (Cloudinary) state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  // YouTube URL state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  // Shared state
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [thumbProgress, setThumbProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('audio');

  // ── Dropzone callbacks ──────────────────────────────────────────────────────

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

  const onDropThumb = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }, []);

  // ── Dropzone hooks ──────────────────────────────────────────────────────────

  const { getRootProps: getAudioProps, getInputProps: getAudioInput, isDragActive: audioDrag } =
    useDropzone({
      onDrop: onDropAudio,
      accept: {
        'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'], 'audio/mp4': ['.m4a'],
        'audio/aac': ['.aac'], 'audio/ogg': ['.ogg'], 'audio/flac': ['.flac'],
        'audio/x-m4a': ['.m4a'], 'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
      },
      maxFiles: 1,
    });

  const { getRootProps: getVideoProps, getInputProps: getVideoInput, isDragActive: videoDrag } =
    useDropzone({
      onDrop: onDropVideo,
      accept: {
        'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/webm': ['.webm'],
        'video/x-msvideo': ['.avi'], 'video/x-matroska': ['.mkv'],
        'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv'],
      },
      maxFiles: 1,
    });

  const { getRootProps: getThumbProps, getInputProps: getThumbInput, isDragActive: thumbDrag } =
    useDropzone({
      onDrop: onDropThumb,
      accept: { 'image/*': [] },
      maxFiles: 1,
    });

  // ── Upload handler ──────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const mediaFile =
      activeTab === 'audio' ? audioFile :
      activeTab === 'video' ? videoFile :
      null;

    if (activeTab === 'youtube') {
      if (!youtubeUrl.trim() || !title.trim() || !user) {
        toast.error('Please add a YouTube URL and a title.');
        return;
      }
      const parsed = parseYouTubeUrl(youtubeUrl.trim());
      if (!parsed) {
        setYoutubeError('Invalid YouTube URL. Please paste a valid youtube.com or youtu.be link.');
        return;
      }
    } else if (!mediaFile || !title.trim() || !user) {
      toast.error('Please add a file and a title.');
      return;
    }

    setUploading(true);

    try {
      // ── Thumbnail (all tabs) ──────────────────────────────────────────────
      let thumbUrl = '';
      if (thumbFile) {
        setUploadStage('Uploading thumbnail…');
        const r = await uploadToCloudinary(thumbFile, setThumbProgress, 'image');
        thumbUrl = r.secureUrl;
      }

      // ── YouTube URL — just save the embed URL, no upload needed ─────────
      if (activeTab === 'youtube') {
        const parsed = parseYouTubeUrl(youtubeUrl.trim())!;
        setUploadStage('Saving to library…');
        await addMedia({
          title: title.trim(),
          description: description.trim(),
          type: 'video',
          category,
          url: parsed.embedUrl,
          thumbnailUrl: thumbUrl || parsed.thumbnailUrl,
          duration: 0,
          fileSize: 0,
          uploadedBy: user!.uid,
          createdAt: new Date().toISOString(),
          playCount: 0,
          tags: [],
        });

        toast.success('YouTube video added to library!');

      // ── Audio / short video via Cloudinary ────────────────────────────────
      } else {
        const file = mediaFile as File;
        const isVideo = activeTab === 'video';
        setUploadStage(isVideo ? 'Uploading video… (may take a while)' : 'Uploading audio…');
        const setProgress = isVideo ? setVideoProgress : setAudioProgress;
        const mediaResult = await uploadToCloudinary(file, setProgress, 'auto');

        // Get duration from the local file
        const duration = await new Promise<number>((resolve) => {
          const el = document.createElement(isVideo ? 'video' : 'audio');
          el.preload = 'metadata';
          el.src = URL.createObjectURL(file);
          el.onloadedmetadata = () => resolve(el.duration || 0);
          el.onerror = () => resolve(mediaResult.duration || 0);
          setTimeout(() => resolve(mediaResult.duration || 0), 5000);
        });

        setUploadStage('Saving to library…');
        await addMedia({
          title: title.trim(),
          description: description.trim(),
          type: isVideo ? 'video' : 'audio',
          category,
          url: mediaResult.secureUrl,
          thumbnailUrl: thumbUrl,
          duration,
          fileSize: file.size,
          uploadedBy: user.uid,
          createdAt: new Date().toISOString(),
          playCount: 0,
          tags: [],
        });

        toast.success('Uploaded successfully!');
      }

      // ── Reset ─────────────────────────────────────────────────────────────
      setAudioFile(null);
      setVideoFile(null);
      setYoutubeUrl('');
      setYoutubeError('');
      setThumbFile(null);
      setThumbPreview('');
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setAudioProgress(0);
      setVideoProgress(0);
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  const currentProgress =
    activeTab === 'audio' ? audioProgress :
    activeTab === 'video' ? videoProgress :
    0;

  const currentFile =
    activeTab === 'audio' ? audioFile :
    activeTab === 'video' ? videoFile :
    null;

  const tabs: { id: Tab; label: string; emoji: string; description: string }[] = [
    { id: 'audio', emoji: '🎵', label: 'Audio', description: 'MP3, WAV, M4A, AAC — via Cloudinary' },
    { id: 'video', emoji: '🎥', label: 'Short Video', description: 'Up to ~500 MB — via Cloudinary' },
    { id: 'youtube', emoji: '▶️', label: 'YouTube', description: 'Paste any YouTube link — free, no upload needed' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-star">Upload Media</h2>
        <p className="text-sm text-twilight mt-1">
          Audio &amp; short video via Cloudinary · Long video via YouTube (free)
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-ink border border-dusk rounded-xl p-1 gap-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-aurora text-white shadow-lg shadow-aurora/20'
                : 'text-twilight hover:text-moon'
            }`}
          >
            <span>{t.emoji}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p className="text-xs text-twilight -mt-2">
        {tabs.find((t) => t.id === activeTab)?.description}
      </p>

      {/* ── Audio dropzone ──────────────────────────────────────────────────── */}
      {activeTab === 'audio' && (
        <FileDropzone
          getRootProps={getAudioProps}
          getInputProps={getAudioInput}
          isDragActive={audioDrag}
          file={audioFile}
          onClear={() => setAudioFile(null)}
          formatSize={formatSize}
          emptyIcon="🎵"
          emptyTitle="Drag & drop audio file"
          emptyFormats="MP3 · WAV · M4A · AAC · OGG · FLAC"
          fileType="Audio"
        />
      )}

      {/* ── Short video dropzone (Cloudinary) ──────────────────────────────── */}
      {activeTab === 'video' && (
        <FileDropzone
          getRootProps={getVideoProps}
          getInputProps={getVideoInput}
          isDragActive={videoDrag}
          file={videoFile}
          onClear={() => setVideoFile(null)}
          formatSize={formatSize}
          emptyIcon="🎥"
          emptyTitle="Drag & drop video file"
          emptyFormats="MP4 · MOV · WebM · AVI · MKV"
          fileType="Short Video"
        />
      )}

      {/* ── YouTube URL input ───────────────────────────────────────────────── */}
      {activeTab === 'youtube' && (
        <div className="space-y-3">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
            </svg>
            <div className="text-sm">
              <p className="text-red-400 font-medium">YouTube — 100% Free</p>
              <p className="text-twilight mt-0.5 text-xs leading-relaxed">
                Paste any YouTube link. No uploads, no storage costs, no limits.
                Supports youtube.com/watch, youtu.be, and youtube.com/shorts links.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-twilight">YouTube URL *</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => { setYoutubeUrl(e.target.value); setYoutubeError(''); }}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={uploading}
              className="input-field disabled:opacity-50"
            />
            {youtubeError && (
              <p className="text-xs text-red-400 mt-1">{youtubeError}</p>
            )}
            {youtubeUrl && !youtubeError && parseYouTubeUrl(youtubeUrl) && (
              <p className="text-xs text-green-400 mt-1">✓ Valid YouTube link detected</p>
            )}
          </div>

          {/* Auto-thumbnail preview */}
          {youtubeUrl && parseYouTubeUrl(youtubeUrl) && (
            <div className="rounded-xl overflow-hidden border border-dusk">
              <img
                src={parseYouTubeUrl(youtubeUrl)!.thumbnailUrl}
                alt="YouTube thumbnail"
                className="w-full h-40 object-cover"
              />
              <p className="text-xs text-twilight px-3 py-2">
                Auto-detected thumbnail (you can override it below)
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Upload progress ─────────────────────────────────────────────────── */}
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
                label={activeTab === 'audio' ? 'Audio' : 'Video'}
                value={currentProgress}
                accent="aurora"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form fields ─────────────────────────────────────────────────────── */}
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

        {/* Thumbnail — available for all three tabs */}
        <div className="space-y-1">
          <label className="text-sm text-twilight">
            Thumbnail
            {activeTab === 'youtube' ? (
              <span className="text-red-400 ml-1">(optional — auto-detected from YouTube)</span>
            ) : (
              <span className="text-dusk ml-1">(optional)</span>
            )}
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
                <img src={thumbPreview} alt="Thumbnail" className="w-full h-20 object-cover rounded-lg" />
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
              <p className="text-twilight text-sm py-2">Add cover image</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <motion.button
        onClick={handleUpload}
        disabled={uploading || (activeTab !== 'youtube' && !currentFile) || (activeTab === 'youtube' && !youtubeUrl.trim()) || !title.trim()}
        whileTap={{ scale: 0.98 }}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {uploadStage || 'Uploading…'}
          </>
        ) : (
          activeTab === 'audio' ? 'Upload Audio to Sanctuary' :
          activeTab === 'video' ? 'Upload Video to Sanctuary' :
          'Add YouTube Video to Library'
        )}
      </motion.button>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface DropzoneProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  file: File | null;
  onClear: () => void;
  formatSize: (b: number) => string;
  emptyIcon: string;
  emptyTitle: string;
  emptyFormats: string;
  fileType: string;
}

function FileDropzone({
  getRootProps, getInputProps, isDragActive, file, onClear,
  formatSize, emptyIcon, emptyTitle, emptyFormats, fileType,
}: DropzoneProps) {
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
        isDragActive ? 'border-aurora bg-aurora/5' :
        file ? 'border-green-500/50 bg-green-500/5' :
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
            <p className="text-twilight text-xs">{formatSize(file.size)} · {fileType}</p>
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
          <div className="text-4xl mb-3">{emptyIcon}</div>
          <p className="text-star font-medium">{emptyTitle}</p>
          <p className="text-twilight text-sm mt-1">or click to browse</p>
          <p className="text-dusk text-xs mt-2">{emptyFormats}</p>
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
  const fillClass =
    accent === 'cosmos'
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
          className={`h-full rounded-full ${fillClass}`}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
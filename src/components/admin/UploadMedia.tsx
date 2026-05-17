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

interface Props { onSuccess: () => void; }

export default function UploadMedia({ onSuccess }: Props) {
  const { user } = useAuth();

  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  // Shared state
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [thumbProgress, setThumbProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');

  // Audio dropzone
  const onDropAudio = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setAudioFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }, [title]);

  // Video dropzone
  const onDropVideo = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setVideoFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }, [title]);

  // Thumbnail dropzone
  const onDropThumb = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps: getAudioProps, getInputProps: getAudioInput, isDragActive: audioDrag } =
    useDropzone({
      onDrop: onDropAudio,
      accept: {
        'audio/mpeg': ['.mp3'],
        'audio/wav': ['.wav'],
        'audio/mp4': ['.m4a'],
        'audio/aac': ['.aac'],
        'audio/ogg': ['.ogg'],
        'audio/flac': ['.flac'],
        'audio/x-m4a': ['.m4a'],
        'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
      },
      maxFiles: 1,
    });

  const { getRootProps: getVideoProps, getInputProps: getVideoInput, isDragActive: videoDrag } =
    useDropzone({
      onDrop: onDropVideo,
      accept: {
        'video/mp4': ['.mp4'],
        'video/quicktime': ['.mov'],
        'video/webm': ['.webm'],
        'video/x-msvideo': ['.avi'],
        'video/x-matroska': ['.mkv'],
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

  const handleUpload = async () => {
    const mediaFile = activeTab === 'audio' ? audioFile : videoFile;
    if (!mediaFile || !title.trim() || !user) {
      toast.error('Please add a file and a title.');
      return;
    }
    setUploading(true);
    const isVideo = activeTab === 'video';

    try {
      // Upload thumbnail
      let thumbUrl = '';
      if (thumbFile) {
        setUploadStage('Uploading thumbnail...');
        const r = await uploadToCloudinary(thumbFile, setThumbProgress, 'image');
        thumbUrl = r.secureUrl;
      }

      // Upload media
      setUploadStage(isVideo ? 'Uploading video... (may take a while)' : 'Uploading audio...');
      const setProgress = isVideo ? setVideoProgress : setAudioProgress;
      const mediaResult = await uploadToCloudinary(mediaFile, setProgress, 'auto');

      // Get duration
      const duration = await new Promise<number>((resolve) => {
        const el = document.createElement(isVideo ? 'video' : 'audio');
        el.preload = 'metadata';
        el.src = URL.createObjectURL(mediaFile);
        el.onloadedmetadata = () => resolve(el.duration || 0);
        el.onerror = () => resolve(mediaResult.duration || 0);
        setTimeout(() => resolve(mediaResult.duration || 0), 5000);
      });

      // Save to Firestore
      setUploadStage('Saving to library...');
      await addMedia({
        title: title.trim(),
        description: description.trim(),
        type: isVideo ? 'video' : 'audio',
        category,
        url: mediaResult.secureUrl,
        thumbnailUrl: thumbUrl,
        duration,
        fileSize: mediaFile.size,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
        playCount: 0,
        tags: [],
      });

      toast.success('Uploaded successfully!');

      // Reset
      setAudioFile(null);
      setVideoFile(null);
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

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  const currentProgress = activeTab === 'audio' ? audioProgress : videoProgress;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-star">Upload Media</h2>
        <p className="text-sm text-twilight mt-1">Files stored on Cloudinary (25 GB free)</p>
      </div>

      {/* Audio / Video tabs */}
      <div className="flex bg-ink border border-dusk rounded-xl p-1 w-fit gap-1">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'audio' ? 'bg-aurora text-white' : 'text-twilight hover:text-moon'}`}
        >
          🎵 Audio
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'video' ? 'bg-aurora text-white' : 'text-twilight hover:text-moon'}`}
        >
          🎥 Video
        </button>
      </div>

      {/* Audio dropzone */}
      {activeTab === 'audio' && (
        <div
          {...getAudioProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            audioDrag ? 'border-aurora bg-aurora/5' :
            audioFile ? 'border-green-500/50 bg-green-500/5' :
            'border-dusk hover:border-twilight hover:bg-mist/30'
          }`}
        >
          <input {...getAudioInput()} />
          {audioFile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-star text-sm font-medium truncate">{audioFile.name}</p>
                <p className="text-twilight text-xs">{formatSize(audioFile.size)} · Audio</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                className="ml-4 text-twilight hover:text-star"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">🎵</div>
              <p className="text-star font-medium">Drag & drop audio file</p>
              <p className="text-twilight text-sm mt-1">or click to browse</p>
              <p className="text-dusk text-xs mt-2">MP3 · WAV · M4A · AAC · OGG · FLAC</p>
            </>
          )}
        </div>
      )}

      {/* Video dropzone */}
      {activeTab === 'video' && (
        <div
          {...getVideoProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            videoDrag ? 'border-aurora bg-aurora/5' :
            videoFile ? 'border-green-500/50 bg-green-500/5' :
            'border-dusk hover:border-twilight hover:bg-mist/30'
          }`}
        >
          <input {...getVideoInput()} />
          {videoFile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-star text-sm font-medium truncate">{videoFile.name}</p>
                <p className="text-twilight text-xs">{formatSize(videoFile.size)} · Video</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                className="ml-4 text-twilight hover:text-star"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">🎥</div>
              <p className="text-star font-medium">Drag & drop video file</p>
              <p className="text-twilight text-sm mt-1">or click to browse</p>
              <p className="text-dusk text-xs mt-2">MP4 · MOV · WebM · AVI · MKV</p>
            </>
          )}
        </div>
      )}

      {/* Upload progress */}
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
            {currentProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-twilight">
                  <span>{activeTab === 'audio' ? 'Audio' : 'Video'} file</span>
                  <span className="text-aurora font-medium">{currentProgress}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    animate={{ width: `${currentProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm text-twilight">Title *</label>
          <input
            type="text" value={title}
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
            rows={3} disabled={uploading}
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
        disabled={uploading || (activeTab === 'audio' ? !audioFile : !videoFile) || !title.trim()}
        whileTap={{ scale: 0.98 }}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {uploadStage || 'Uploading…'}
          </>
        ) : `Upload ${activeTab === 'audio' ? 'Audio' : 'Video'} to Sanctuary`}
      </motion.button>
    </div>
  );
}
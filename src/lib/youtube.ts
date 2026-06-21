 
export interface YouTubeVideoInfo {
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
}
 
/**
 * Extracts the YouTube video ID from any YouTube URL format:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://youtube.com/shorts/VIDEO_ID
 */
export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
 
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  }
 
  return null;
}
 
export function isYouTubeEmbed(url: string): boolean {
  return url.includes('youtube.com/embed/') || url.includes('youtu.be/');
}
 
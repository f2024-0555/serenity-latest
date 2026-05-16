export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'blocked' | 'pending';
export type MediaType = 'audio' | 'video';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  category: string;
  url: string;
  thumbnailUrl: string;
  duration: number; // seconds
  fileSize: number; // bytes
  uploadedBy: string;
  createdAt: string;
  playCount: number;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
  mediaCount: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  mediaItems: string[]; // media IDs
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
}

export interface Favorite {
  userId: string;
  mediaId: string;
  addedAt: string;
}

export interface History {
  userId: string;
  mediaId: string;
  progress: number; // seconds
  lastPlayed: string;
  completed: boolean;
}

export interface PlayerState {
  currentMedia: MediaItem | null;
  queue: MediaItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  playbackSpeed: number;
  showPlayer: boolean;
}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, storage, auth } from './firebase';
import { AppUser, MediaItem, Category, Playlist, Favorite, History } from '@/types';

// ─── USERS ──────────────────────────────────────────────────────────────────
export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as AppUser);
}

export async function updateUserStatus(uid: string, status: AppUser['status']) {
  await updateDoc(doc(db, 'users', uid), { status });
}

export async function updateUserRole(uid: string, role: AppUser['role']) {
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function deleteUser(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const newUser: AppUser = {
    uid: cred.user.uid,
    email,
    displayName,
    role: 'user',
    status: 'pending',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', cred.user.uid), newUser);
  return newUser;
}

// ─── MEDIA ───────────────────────────────────────────────────────────────────
export async function getAllMedia(): Promise<MediaItem[]> {
  const snap = await getDocs(
    query(collection(db, 'media'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem));
}

export async function getMediaByCategory(category: string): Promise<MediaItem[]> {
  const snap = await getDocs(
    query(collection(db, 'media'), where('category', '==', category), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem));
}

export async function getRecentMedia(limitCount = 10): Promise<MediaItem[]> {
  const snap = await getDocs(
    query(collection(db, 'media'), orderBy('createdAt', 'desc'), limit(limitCount))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem));
}

export async function addMedia(media: Omit<MediaItem, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'media'), media);
  return docRef.id;
}

export async function updateMedia(id: string, data: Partial<MediaItem>) {
  await updateDoc(doc(db, 'media', id), data);
}

export async function deleteMedia(id: string, url: string, thumbUrl: string) {
  await deleteDoc(doc(db, 'media', id));
  try {
    await deleteObject(ref(storage, url));
    if (thumbUrl) await deleteObject(ref(storage, thumbUrl));
  } catch {}
}

export async function incrementPlayCount(id: string) {
  await updateDoc(doc(db, 'media', id), { playCount: increment(1) });
}

// ─── UPLOAD ──────────────────────────────────────────────────────────────────
export function uploadFile(
  file: File,
  path: string,
  onProgress: (p: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const metadata = { contentType: file.type, cacheControl: 'public,max-age=3600' };
    const task = uploadBytesResumable(storageRef, file, metadata);

    let lastProgressTime = Date.now();
    let lastPct = 0;
    const timeoutCheck = setInterval(() => {
      if (Date.now() - lastProgressTime > 30000) {
        clearInterval(timeoutCheck);
        task.cancel();
        reject(new Error('Upload timed out. Check your internet and Firebase Storage rules.'));
      }
    }, 5000);

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        if (pct !== lastPct) { lastPct = pct; lastProgressTime = Date.now(); onProgress(pct); }
      },
      (error) => {
        clearInterval(timeoutCheck);
        const msgs: Record<string, string> = {
          'storage/unauthorized': 'Permission denied — publish your Storage rules in Firebase Console.',
          'storage/canceled': 'Upload cancelled.',
          'storage/quota-exceeded': 'Firebase Storage quota exceeded.',
        };
        reject(new Error(msgs[error.code] || `Upload failed: ${error.message}`));
      },
      async () => {
        clearInterval(timeoutCheck);
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}
// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

export async function addCategory(cat: Omit<Category, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'categories'), cat);
  return docRef.id;
}

// ─── FAVORITES ───────────────────────────────────────────────────────────────
export async function getUserFavorites(userId: string): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db, 'favorites'), where('userId', '==', userId))
  );
  return snap.docs.map((d) => (d.data() as Favorite).mediaId);
}

export async function toggleFavorite(userId: string, mediaId: string, isFav: boolean) {
  const favRef = doc(db, 'favorites', `${userId}_${mediaId}`);
  if (isFav) {
    await deleteDoc(favRef);
  } else {
    await setDoc(favRef, { userId, mediaId, addedAt: new Date().toISOString() });
  }
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
export async function saveProgress(userId: string, mediaId: string, progress: number, completed = false) {
  const histRef = doc(db, 'history', `${userId}_${mediaId}`);
  await setDoc(histRef, {
    userId,
    mediaId,
    progress,
    lastPlayed: new Date().toISOString(),
    completed,
  });
}

export async function getUserHistory(userId: string): Promise<History[]> {
  const snap = await getDocs(
    query(
      collection(db, 'history'),
      where('userId', '==', userId),
      orderBy('lastPlayed', 'desc'),
      limit(20)
    )
  );
  return snap.docs.map((d) => d.data() as History);
}

// ─── PLAYLISTS ────────────────────────────────────────────────────────────────
export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const snap = await getDocs(
    query(collection(db, 'playlists'), where('createdBy', '==', userId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Playlist));
}

export async function createPlaylist(playlist: Omit<Playlist, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'playlists'), playlist);
  return docRef.id;
}

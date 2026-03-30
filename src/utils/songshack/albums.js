import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";

const ALBUMS = "ss_albums";

export async function getAlbums() {
  const snap = await getDocs(collection(db, ALBUMS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAlbum(id) {
  const snap = await getDoc(doc(db, ALBUMS, id));
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...snap.data() };
}

export async function addAlbum(data) {
  return addDoc(collection(db, ALBUMS), data);
}

export async function getReviews(albumId) {
  const q = query(
    collection(db, ALBUMS, albumId, "reviews"),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addReview(albumId, review) {
  return addDoc(collection(db, ALBUMS, albumId, "reviews"), review);
}
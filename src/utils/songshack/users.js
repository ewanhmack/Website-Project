import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const USERS = "ss_users";

export async function getUser(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) {
    return null;
  }
  return snap.data();
}

export async function createUser(uid, data) {
  return setDoc(doc(db, USERS, uid), data);
}

export async function updateUser(uid, data) {
  return updateDoc(doc(db, USERS, uid), data);
}

export async function isUsernameTaken(username) {
  const q = query(collection(db, USERS), where("username", "==", username));
  const snap = await getDocs(q);
  return !snap.empty;
}
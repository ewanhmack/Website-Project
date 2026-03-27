import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("order"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProjects(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load projects");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return { projects, loading, error };
}
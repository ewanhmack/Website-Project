import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      try {
        const cacheKey = "projects_cache";
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          setProjects(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const q = query(collection(db, "projects"), orderBy("order"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!cancelled) {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          setProjects(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load projects");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, loading, error };
}
import { useState, useEffect, useRef, useCallback } from "react";

const TOKEN_FUNCTION_URL = "https://europe-west2-website-project-deb45.cloudfunctions.net/getSpotifyToken";

const NOISE_PATTERN = /\s*[\(\[](official\s*(video|audio|music\s*video|lyric\s*video)|lyrics?|ft\.?|feat\.?|explicit|remaster(ed)?|live|acoustic|cover|radio\s*edit|hd|4k)[^\)\]]*[\)\]]/gi;

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  spotifyUrl: string;
  bpm: number | null;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

function cleanQuery(query: string): string {
  return query.replace(NOISE_PATTERN, "").trim();
}

function buildSpotifyQuery(query: string): string {
  const cleaned = cleanQuery(query);

  const byMatch = cleaned.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return `track:${byMatch[1].trim()} artist:${byMatch[2].trim()}`;
  }

  const dashMatch = cleaned.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (dashMatch) {
    return `artist:${dashMatch[1].trim()} track:${dashMatch[2].trim()}`;
  }

  return cleaned;
}

export function useSpotify() {
  const [token, setToken] = useState<string | null>(null);
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [candidates, setCandidates] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenCache = useRef<CachedToken | null>(null);

  const getToken = useCallback(async (): Promise<string> => {
    const now = Date.now();
    if (tokenCache.current && tokenCache.current.expiresAt > now + 60_000) {
      return tokenCache.current.token;
    }

    const res = await fetch(TOKEN_FUNCTION_URL);
    if (!res.ok) {
      throw new Error("Failed to fetch Spotify token");
    }
    const data = await res.json();
    tokenCache.current = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };
    setToken(data.access_token);
    return data.access_token;
  }, []);

  useEffect(() => {
    getToken().catch((err) => setError(err.message));
  }, [getToken]);

  const searchTracks = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        return;
      }
      setSearching(true);
      setError(null);
      setTrack(null);
      setCandidates([]);

      try {
        const accessToken = await getToken();
        const q = buildSpotifyQuery(query);

        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const searchData = await searchRes.json();
        const items = searchData.tracks?.items ?? [];

        if (items.length === 0) {
          throw new Error("No tracks found. Try a different search.");
        }

        const results: SpotifyTrack[] = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          artist: item.artists.map((a: { name: string }) => a.name).join(", "),
          album: item.album.name,
          albumArt: item.album.images[0]?.url ?? "",
          spotifyUrl: item.external_urls.spotify,
          bpm: null,
        }));

        setCandidates(results);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Search failed.";
        setError(message);
      } finally {
        setSearching(false);
      }
    },
    [getToken]
  );

  const selectTrack = useCallback(
    (candidate: SpotifyTrack): void => {
      setCandidates([]);
      setTrack({ ...candidate, bpm: 120 });
    },
    []
  );

  return { token, track, candidates, searching, error, searchTracks, selectTrack };
}
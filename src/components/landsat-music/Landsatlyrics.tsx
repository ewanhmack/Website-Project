import { useState, useEffect, useRef, useCallback } from "react";
import { useSpotify, SpotifyTrack } from "./useSpotify";
import "../css/landsat.css";

const BASE_URL = "https://science.nasa.gov/specials/your-name-in-landsat/images/";
const MAX_VARIANT = 3;
const BPM_MULTIPLIER = 2;

function getVariant(char: string, seed: number): number {
  return (seed * 7 + char.charCodeAt(0) * 13) % (MAX_VARIANT + 1);
}

const TRACK_NOISE = /\s*[-–(].*?(remaster\w*|re-?master\w*|deluxe|edition edition|bonus|live|acoustic|version|mix|edit|single|ep|\d{4}).*?[)-]?\s*$/gi;

function cleanTrackName(name: string): string {
  return name.replace(TRACK_NOISE, "").trim();
}

function parseLyrics(text: string): string[] {
  return text
    .split("\n")
    .flatMap((line, li) => {
      const words = line.split(/\s+/).filter(Boolean);
      return li > 0 ? ["\n", ...words] : words;
    })
    .filter(Boolean);
}

interface LetterTileProps {
  char: string;
  seed: number;
}

function LetterTile({ char, seed }: LetterTileProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const upper = char.toUpperCase();
  const variant = getVariant(upper, seed);
  const primaryUrl = `${BASE_URL}${upper.toLowerCase()}_${variant}.jpg`;
  const fallbackUrl = `${BASE_URL}${upper.toLowerCase()}_0.jpg`;

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      } else {
        setStatus("error");
      }
    },
    [fallbackUrl]
  );

  return (
    <div className="ll-tile">
      <div className="ll-tile-img-wrap">
        {status !== "error" && (
          <img
            src={primaryUrl}
            alt={`Letter ${upper}`}
            className="ll-tile-img"
            style={{ display: status === "loaded" ? "block" : "none" }}
            onLoad={() => setStatus("loaded")}
            onError={handleError}
          />
        )}
        {status === "loading" && <div className="ll-tile-loading" />}
        {status === "error" && <span className="ll-tile-error">{upper}</span>}
      </div>
      <div className="ll-tile-label">{upper}</div>
    </div>
  );
}

function WordDisplay({ word }: { word: string }) {
  const letters = word.toUpperCase().replace(/[^A-Z]/g, "").split("");
  return (
    <div className="ll-word-display">
      {letters.map((char, i) => (
        <LetterTile key={i} char={char} seed={i} />
      ))}
    </div>
  );
}

function TrackBar({ track }: { track: SpotifyTrack }) {
  return (
    <div className="ll-track-bar">
      {track.albumArt && (
        <img src={track.albumArt} alt={track.name} className="ll-track-art" />
      )}
      <div className="ll-track-info">
        <span className="ll-track-name">{track.name}</span>
        <span className="ll-track-artist">{track.artist}</span>
      </div>
      {track.bpm && track.bpm !== 120 && (
        <span className="ll-track-bpm">{track.bpm} BPM</span>
      )}
      <a
        href={track.spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ll-spotify-link"
      >
        Open in Spotify
      </a>
    </div>
  );
}

function CandidateList({
  candidates,
  onSelect,
}: {
  candidates: SpotifyTrack[];
  onSelect: (track: SpotifyTrack) => void;
}) {
  return (
    <div className="ll-candidates">
      <p className="ll-candidates-label">Select the right track:</p>
      {candidates.map((c) => (
        <button
          key={c.id}
          className="ll-candidate"
          onClick={() => onSelect(c)}
        >
          {c.albumArt && (
            <img src={c.albumArt} alt={c.name} className="ll-candidate-art" />
          )}
          <div className="ll-candidate-info">
            <span className="ll-candidate-name">{c.name}</span>
            <span className="ll-candidate-meta">{c.artist} · {c.album}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function LandsatLyrics() {
  const { track, candidates, searching, error: spotifyError, searchTracks, selectTrack } = useSpotify();

  const [songQuery, setSongQuery] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lyricsStatus, setLyricsStatus] = useState("");
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [bpmMultiplier, setBpmMultiplier] = useState(BPM_MULTIPLIER);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const visibleWords = words.filter((w) => w !== "\n");
  const activeVisibleIndex = (() => {
    let count = 0;
    for (let i = 0; i < activeIndex; i++) {
      if (words[i] !== "\n") {
        count++;
      }
    }
    return count;
  })();

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (!track || words.length === 0) {
      return;
    }
    const bpm = track.bpm ?? 120;
    const msPerBeat = 60_000 / bpm;
    const msPerWord = msPerBeat * (7 - bpmMultiplier);

    intervalRef.current = setInterval(() => {
      const next = activeIndexRef.current + 1;
      if (next >= words.length) {
        stopPlayback();
        return;
      }
      const nextNonNewline = (() => {
        let i = next;
        while (i < words.length && words[i] === "\n") {
          i++;
        }
        return i;
      })();
      if (nextNonNewline >= words.length) {
        stopPlayback();
        return;
      }
      setActiveIndex(nextNonNewline);
    }, msPerWord);

    setPlaying(true);
  }, [track, words, bpmMultiplier, stopPlayback]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    stopPlayback();
  }, [words, stopPlayback]);

  const handleSearch = async () => {
    if (!songQuery.trim()) {
      return;
    }
    stopPlayback();
    setWords([]);
    setActiveIndex(0);
    setLyricsStatus("");
    await searchTracks(songQuery);
  };

  useEffect(() => {
    if (!track) {
      return;
    }

    const fetchLyrics = async () => {
      setLyricsLoading(true);
      setLyricsStatus("Fetching lyrics...");
      stopPlayback();
      setWords([]);
      setActiveIndex(0);

      try {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(track.artist)}/${encodeURIComponent(cleanTrackName(track.name))}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("Lyrics not found for this track.");
        }

        const data = await res.json();
        const lyrics: string = data.lyrics?.trim() ?? "";

        if (!lyrics) {
          throw new Error("No lyrics returned for that song.");
        }

        setWords(parseLyrics(lyrics));
        setActiveIndex(0);
        setLyricsStatus("");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch lyrics.";
        setLyricsStatus(message);
      } finally {
        setLyricsLoading(false);
      }
    };

    fetchLyrics();
  }, [track]);

  const handlePrev = () => {
    stopPlayback();
    setActiveIndex((i) => {
      let prev = i - 1;
      while (prev > 0 && words[prev] === "\n") {
        prev--;
      }
      return Math.max(0, prev);
    });
  };

  const handleNext = () => {
    stopPlayback();
    setActiveIndex((i) => {
      let next = i + 1;
      while (next < words.length && words[next] === "\n") {
        next++;
      }
      return Math.min(words.length - 1, next);
    });
  };

  const handlePlayPause = () => {
    if (playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const handleRestart = () => {
    stopPlayback();
    const firstWord = (() => {
      let i = 0;
      while (i < words.length && words[i] === "\n") {
        i++;
      }
      return i;
    })();
    setActiveIndex(firstWord);
  };

  const currentWord = words[activeIndex] ?? "";
  const isLoading = searching || lyricsLoading;
  const statusMessage = spotifyError || lyricsStatus;

  return (
    <div className="ll-page">
      <div className="ll-header">
        <div className="ll-search-row">
          <input
            className="ll-input"
            type="text"
            placeholder="Mr Brightside by The Killers"
            value={songQuery}
            onChange={(e) => setSongQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            disabled={isLoading}
          />
          <button
            className="ll-button"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Search"}
          </button>
        </div>

        {statusMessage && <p className="ll-status">{statusMessage}</p>}
        {candidates.length > 0 && (
          <CandidateList candidates={candidates} onSelect={selectTrack} />
        )}
        {track && candidates.length === 0 && <TrackBar track={track} />}
      </div>

      {words.length > 0 && (
        <>
          <div className="ll-stage">
            {currentWord && currentWord !== "\n" && (
              <WordDisplay word={currentWord} />
            )}
            <div className="ll-progress">
              {activeVisibleIndex + 1} / {visibleWords.length}
            </div>
          </div>

          <div className="ll-controls">
            <button className="ll-ctrl-btn" onClick={handleRestart} title="Restart">
              ⟪
            </button>
            <button className="ll-ctrl-btn" onClick={handlePrev} title="Previous">
              ‹
            </button>
            <button className="ll-ctrl-btn ll-play-btn" onClick={handlePlayPause}>
              {playing ? "Pause" : "Play"}
            </button>
            <button className="ll-ctrl-btn" onClick={handleNext} title="Next">
              ›
            </button>

            <div className="ll-bpm-control">
              <label className="ll-bpm-label">Speed</label>
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={bpmMultiplier}
                onChange={(e) => {
                  setBpmMultiplier(parseFloat(e.target.value));
                  if (playing) {
                    stopPlayback();
                  }
                }}
                className="ll-bpm-slider"
              />
              <span className="ll-bpm-value">{bpmMultiplier}x</span>
            </div>
          </div>

          <div className="ll-lyrics-scroll">
            {words.map((word, i) => {
              if (word === "\n") {
                return <br key={i} />;
              }
              return (
                <span
                  key={i}
                  className={`ll-lyric-word${i === activeIndex ? " active" : ""}`}
                  onClick={() => {
                    stopPlayback();
                    setActiveIndex(i);
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </>
      )}

      <p className="ll-attribution">
        Imagery from NASA/USGS Landsat ·{" "}
        <a
          href="https://science.nasa.gov/mission/landsat/"
          target="_blank"
          rel="noopener noreferrer"
          className="ll-attr-link"
        >
          Learn about Landsat
        </a>{" "}
        · Lyrics via{" "}
        <a
          href="https://lyricsovh.docs.apiary.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="ll-attr-link"
        >
          lyrics.ovh
        </a>
      </p>
    </div>
  );
}
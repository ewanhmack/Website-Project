import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { useProjects } from "../../utils/useProjects";
import { getPhotoUrl } from "../../utils/photos";
import { firstImage, resolveMediaSrc } from "../../utils/projects";
import { slugify } from "../../utils/projectsExtras";
import { timeAgo } from "../../utils/time";
import Reveal from "../Reveal";

function useLatestPhoto() {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const categoriesSnap = await getDocs(collection(db, "photography"));
        const firstCategory = categoriesSnap.docs[0]?.id;
        if (!firstCategory) {
          return;
        }

        const q = query(
          collection(db, "photography", firstCategory, "photos"),
          orderBy("order", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        const doc = snap.docs[0];

        if (doc && !cancelled) {
          setPhoto({ id: doc.id, category: firstCategory, ...doc.data() });
        }
      } catch {
        // Decorative section — fail silently rather than surface an error.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return photo;
}

function useLatestTrack() {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const q = query(
          collection(db, "music", "recently-played", "tracks"),
          orderBy("played_at", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        const doc = snap.docs[0];

        if (doc && !cancelled) {
          setTrack(doc.data());
        }
      } catch {
        // Decorative section — fail silently rather than surface an error.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return track;
}

function SnapshotTile({ eyebrow, href, imageSrc, title, subtitle, delay }) {
  return (
    <Reveal as="div" delay={delay}>
      <a className="snapshot-tile" href={href}>
        <div className="snapshot-tile-media">
          {imageSrc ? <img src={imageSrc} alt="" loading="lazy" decoding="async" /> : null}
        </div>
        <div className="snapshot-tile-body">
          <div className="snapshot-tile-eyebrow">{eyebrow}</div>
          <div className="snapshot-tile-title">{title}</div>
          {subtitle ? <div className="snapshot-tile-subtitle">{subtitle}</div> : null}
        </div>
      </a>
    </Reveal>
  );
}

export default function Snapshot() {
  const { projects } = useProjects();
  const photo = useLatestPhoto();
  const track = useLatestTrack();

  const latestProject = projects.length > 0 ? projects[projects.length - 1] : null;

  const tiles = [];

  if (latestProject) {
    tiles.push(
      <SnapshotTile
        key="project"
        eyebrow="Latest project"
        href={`#/projects/${slugify(latestProject.header)}`}
        imageSrc={firstImage(latestProject) ? resolveMediaSrc(firstImage(latestProject)) : null}
        title={latestProject.header}
        subtitle={latestProject.description}
        delay={0}
      />
    );
  }

  if (photo) {
    tiles.push(
      <SnapshotTile
        key="photo"
        eyebrow="Recent shot"
        href="#/photography"
        imageSrc={getPhotoUrl(photo)}
        title={photo.header || "Untitled"}
        subtitle={photo.category}
        delay={80}
      />
    );
  }

  if (track) {
    tiles.push(
      <SnapshotTile
        key="track"
        eyebrow="Recently played"
        href="#/music"
        imageSrc={track.album_art}
        title={track.track}
        subtitle={`${track.artist} · ${timeAgo(track.played_at)}`}
        delay={160}
      />
    );
  }

  if (tiles.length === 0) {
    return null;
  }

  return (
    <section className="section snapshot-section" aria-label="Live snapshot">
      <div className="container">
        <Reveal as="header" className="section-head">
          <div className="section-eyebrow">Right now</div>
          <h2 className="section-title">A snapshot of the site</h2>
          <p className="muted">Live from the projects, photography, and music pages.</p>
        </Reveal>

        <div className="snapshot-grid">{tiles}</div>
      </div>
    </section>
  );
}

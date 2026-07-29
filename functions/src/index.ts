import { setGlobalOptions } from "firebase-functions";
import { onObjectFinalized, onObjectDeleted } from "firebase-functions/v2/storage";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as path from "path";
import * as https from "https";

setGlobalOptions({ maxInstances: 10 });
initializeApp();

const db = getFirestore();

function getOrientation(width: number, height: number): string {
  if (height > width) {
    return "Portraits";
  }
  return "Landscapes";
}

// Kept in sync by hand with src/utils/photoTags.js — the functions package
// deploys standalone, so it can't import across the project boundary.
const PHOTO_TAGS = [
  "Forest",
  "Mountains",
  "Water",
  "Sky",
  "City",
  "Architecture",
  "Animals",
  "Plants",
  "People",
  "Night",
];

const TAG_SYSTEM_PROMPT = `You are labeling photography subject matter for a portfolio website.
Given a photo, choose 1 to 3 tags that best describe its main subject(s) from this fixed list ONLY:
${PHOTO_TAGS.join(", ")}

Respond with ONLY a JSON array of strings from that list, e.g. ["Forest","Animals"].
Do not invent tags outside this list. If genuinely nothing fits, respond with [].`;

const TITLE_SYSTEM_PROMPT = `You are writing short titles for photos in a personal photography portfolio.
Given a photo, write one concise title: 2 to 5 words, title case, no quotation marks, no trailing period.
Focus on the specific subject, mood, or moment — avoid generic words like "Photo", "Image", or "Untitled".
Respond with ONLY the title text, nothing else.`;

async function callClaudeVision(
  apiKey: string,
  imageUrl: string,
  systemPrompt: string,
  userText: string,
  maxTokens: number
): Promise<string> {
  const body = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: userText },
        ],
      },
    ],
  });

  const response = await httpPost(
    "https://api.anthropic.com/v1/messages",
    {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body
  );

  const parsed = JSON.parse(response);
  return parsed.content?.[0]?.text ?? "";
}

async function classifyPhotoTags(apiKey: string, imageUrl: string): Promise<string[]> {
  const text = await callClaudeVision(apiKey, imageUrl, TAG_SYSTEM_PROMPT, "Classify this photo.", 100);
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((tag: unknown): tag is string => typeof tag === "string" && PHOTO_TAGS.includes(tag));
  } catch {
    return [];
  }
}

async function suggestPhotoTitle(apiKey: string, imageUrl: string): Promise<string> {
  const text = await callClaudeVision(apiKey, imageUrl, TITLE_SYSTEM_PROMPT, "Title this photo.", 30);
  return text.trim().replace(/^["']|["']$/g, "").replace(/\.$/, "");
}

async function writeFunctionStatus(
  name: string,
  status: "ok" | "error",
  error?: string
): Promise<void> {
  const ref = db
    .collection("_meta")
    .doc("functionStatus")
    .collection("functions")
    .doc(name);

  const now = new Date().toISOString();

  await ref.set({
    lastRun: now,
    status,
    lastError: error ?? null,
  });

  await ref.collection("history").add({
    timestamp: now,
    status,
    error: error ?? null,
  });
}

async function trackUsage(
  metric: string,
  count: number = 1
): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const week = `W${String(Math.ceil(now.getDate() / 7)).padStart(2, "0")}`;

  const monthKey = `${year}-${month}`;
  const dayKey = `${year}-${month}-${day}`;
  const weekKey = `${year}-${month}-${week}`;
  const yearKey = `${year}`;

  const usageRef = db.collection("_meta").doc("usage");

  await Promise.all([
    usageRef.collection("months").doc(monthKey).set(
      { [metric]: FieldValue.increment(count), lastUpdated: now.toISOString() },
      { merge: true }
    ),
    usageRef.collection("days").doc(dayKey).set(
      { [metric]: FieldValue.increment(count), lastUpdated: now.toISOString() },
      { merge: true }
    ),
    usageRef.collection("weeks").doc(weekKey).set(
      { [metric]: FieldValue.increment(count), lastUpdated: now.toISOString() },
      { merge: true }
    ),
    usageRef.collection("years").doc(yearKey).set(
      { [metric]: FieldValue.increment(count), lastUpdated: now.toISOString() },
      { merge: true }
    ),
  ]);
}
function httpPost(url: string, headers: Record<string, string>, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => { resolve(data); });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpGet(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: `${urlObj.pathname}${urlObj.search}`,
        method: "GET",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => { resolve(data); });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function getSpotifyAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;

  const response = await httpPost(
    "https://accounts.spotify.com/api/token",
    {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body
  );

  const parsed = JSON.parse(response);

  if (!parsed.access_token) {
    console.error("Spotify token error:", JSON.stringify(parsed));
    throw new Error("Failed to get Spotify access token");
  }

  return parsed.access_token;
}

export const getSpotifyToken = onRequest(
  {
    region: "europe-west2",
    secrets: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"],
  },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID!;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      const response = await httpPost(
        "https://accounts.spotify.com/api/token",
        {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        "grant_type=client_credentials"
      );

      const data = JSON.parse(response);
      res.json({ access_token: data.access_token, expires_in: data.expires_in });
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "Unknown error" });
    }
  }
);

async function fetchSpotifyRecentlyPlayed(accessToken: string): Promise<Record<string, string>[]> {
  const response = await httpGet(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    { Authorization: `Bearer ${accessToken}` }
  );

  const parsed = JSON.parse(response);

  if (!parsed.items) {
    console.error("Spotify API error:", JSON.stringify(parsed));
    return [];
  }

  return parsed.items.map((item: any) => ({
    track: item.track.name,
    artist: item.track.artists.map((a: any) => a.name).join(", "),
    album: item.track.album.name,
    album_art: item.track.album.images[0]?.url ?? "",
    url: item.track.external_urls.spotify,
    played_at: item.played_at,
  }));
}

export const fetchRecentlyPlayed = onSchedule(
  {
    schedule: "every 5 minutes",
    region: "europe-west2",
    secrets: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"],
  },
  async () => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID!;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
      const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN!;

      const accessToken = await getSpotifyAccessToken(clientId, clientSecret, refreshToken);
      const tracks = await fetchSpotifyRecentlyPlayed(accessToken);

      if (tracks.length === 0) {
        console.log("No tracks returned from Spotify.");
        await writeFunctionStatus("fetchRecentlyPlayed", "ok");
        await trackUsage("functionInvocations");
        return;
      }

      const tracksRef = db.collection("music").doc("recently-played").collection("tracks");

      let added = 0;
      for (const track of tracks) {
        const docRef = tracksRef.doc(track.played_at);
        const existing = await docRef.get();
        if (!existing.exists) {
          await docRef.set(track);
          added++;
        }
      }

      console.log(`Added ${added} new tracks.`);
      await writeFunctionStatus("fetchRecentlyPlayed", "ok");
      await trackUsage("functionInvocations");
      await trackUsage("firestoreReads", tracks.length);
      await trackUsage("firestoreWrites", added);
    } catch (err: any) {
      await writeFunctionStatus("fetchRecentlyPlayed", "error", err?.message ?? "Unknown error");
      throw err;
    }
  }
);

export const getRecentlyPlayed = onRequest(
    { region: "europe-west2" },
    async (req, res) => {
        res.set("Access-Control-Allow-Origin", "*");

        const since = req.query.since ? String(req.query.since) : null;

        try {
            let query: FirebaseFirestore.Query = db
                .collection("music")
                .doc("recently-played")
                .collection("tracks")
                .orderBy("played_at", "desc");

            if (since) {
                query = query.where("played_at", ">", since);
            }

            const snapshot = await query.get();
            const tracks = snapshot.docs.map((doc) => doc.data());

            res.json({ tracks });
        } catch (err: any) {
            res.status(500).json({ error: err?.message ?? "Unknown error" });
        }
    }
);

export const onPhotoUploaded = onObjectFinalized(
  { timeoutSeconds: 60, memory: "256MiB", region: "europe-west2", secrets: ["ANTHROPIC_API_KEY"] },
  async (event) => {
    try {
      const filePath = event.data.name;

      if (!filePath.startsWith("images/photos/")) {
        return;
      }

      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();

      if (ext !== ".webp") {
        return;
      }

      const bucket = getStorage().bucket(event.data.bucket);
      const file = bucket.file(filePath);
      const [fileMetadata] = await file.getMetadata();
      const custom = fileMetadata.metadata ?? {};

      const metadata: Record<string, string> = {};

      if (custom.shutterSpeed) { metadata.shutterSpeed = String(custom.shutterSpeed); }
      if (custom.aperture) { metadata.aperture = String(custom.aperture); }
      if (custom.iso) { metadata.iso = String(custom.iso); }
      if (custom.createdDateTime) { metadata.createdDateTime = String(custom.createdDateTime); }
      if (custom.lensModel) { metadata.lensModel = String(custom.lensModel); }

      const width = parseInt(String(custom.imageWidth ?? "0"), 10);
      const height = parseInt(String(custom.imageHeight ?? "0"), 10);

      const category = getOrientation(width, height);
      const categoryRef = db.collection("photography").doc(category);

      await categoryRef.set({ name: category }, { merge: true });

      const existingPhotos = await categoryRef
        .collection("photos")
        .orderBy("order", "desc")
        .limit(1)
        .get();

      const nextOrder = existingPhotos.empty
        ? 0
        : (existingPhotos.docs[0].data().order ?? 0) + 1;

      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "01-01-2100",
      });

      const photoData: Record<string, unknown> = {
        image: fileName,
        storageUrl: url,
        storagePath: filePath,
        metadata,
        order: nextOrder,
        uploadedAt: new Date().toISOString(),
      };

      // Best-effort AI enrichment: tags are auto-applied (same as the batch
      // seed-scripts/tagPhotos.mjs), title lands as a suggestion for review
      // in Admin > Photos (same as seed-scripts/suggestTitles.mjs) rather
      // than being applied directly. Never blocks the upload itself.
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        try {
          const [tags, suggestedTitle] = await Promise.all([
            classifyPhotoTags(apiKey, url),
            suggestPhotoTitle(apiKey, url),
          ]);
          if (tags.length > 0) {
            photoData.tags = tags;
          }
          if (suggestedTitle) {
            photoData.suggestedTitle = suggestedTitle;
          }
        } catch (err: any) {
          console.error(`AI enrichment failed for ${fileName}:`, err?.message ?? err);
        }
      }

      await categoryRef.collection("photos").add(photoData);

      console.log(`Added ${fileName} to ${category}`);
      await writeFunctionStatus("onPhotoUploaded", "ok");
      await trackUsage("functionInvocations");
      await trackUsage("storageReads");
      await trackUsage("firestoreReads", 2);
      await trackUsage("firestoreWrites", 2);
    } catch (err: any) {
      await writeFunctionStatus("onPhotoUploaded", "error", err?.message ?? "Unknown error");
      throw err;
    }
  }
);

export const onPhotoDeleted = onObjectDeleted(
  { region: "europe-west2" },
  async (event) => {
    try {
      const filePath = event.data.name;

      if (!filePath.startsWith("images/photos/")) {
        return;
      }

      const fileName = path.basename(filePath);
      const categories = await db.collection("photography").get();

      let deleted = 0;
      for (const categoryDoc of categories.docs) {
        const photos = await categoryDoc.ref
          .collection("photos")
          .where("image", "==", fileName)
          .get();

        for (const photoDoc of photos.docs) {
          await photoDoc.ref.delete();
          deleted++;
          console.log(`Deleted Firestore doc for ${fileName} from ${categoryDoc.id}`);
        }
      }

      await writeFunctionStatus("onPhotoDeleted", "ok");
      await trackUsage("functionInvocations");
      await trackUsage("firestoreReads", categories.size);
      await trackUsage("firestoreWrites", deleted);
    } catch (err: any) {
      await writeFunctionStatus("onPhotoDeleted", "error", err?.message ?? "Unknown error");
      throw err;
    }
  }
);
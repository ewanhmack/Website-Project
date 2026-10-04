// One-off helper to regenerate SPOTIFY_REFRESH_TOKEN after Spotify revokes it.
//
// Usage:
//   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/get-spotify-refresh-token.mjs
//
// Before running: in the Spotify Developer Dashboard, add this exact redirect
// URI to your app's "Redirect URIs" list, then remove it again afterwards if
// you'd rather not leave it there:
//   http://127.0.0.1:8888/callback
//
// The script opens a local server, prints an authorize URL to click, and once
// you approve access in Spotify it exchanges the returned code for tokens and
// prints the new refresh token. Paste that into:
//   firebase functions:secrets:set SPOTIFY_REFRESH_TOKEN

import http from "http";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPE = "user-read-recently-played";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars before running this script.",
  );
  process.exit(1);
}

const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.searchParams.set("client_id", CLIENT_ID);
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authorizeUrl.searchParams.set("scope", SCOPE);

console.log("\nOpen this URL in your browser and log in / approve access:\n");
console.log(authorizeUrl.toString());
console.log("\nWaiting for the redirect back to", REDIRECT_URI, "...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/callback") {
    res.writeHead(404);
    res.end();
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Spotify returned an error: ${error}`);
    console.error("Spotify returned an error:", error);
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Success — you can close this tab and go back to the terminal.");

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64",
  );
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await tokenRes.json();

  if (!data.refresh_token) {
    console.error("Token exchange failed:", JSON.stringify(data, null, 2));
    server.close();
    process.exit(1);
  }

  console.log("New refresh token (save this to the SPOTIFY_REFRESH_TOKEN secret):\n");
  console.log(data.refresh_token);
  console.log(
    "\nNext: firebase functions:secrets:set SPOTIFY_REFRESH_TOKEN, then redeploy fetchRecentlyPlayed.",
  );

  server.close();
  process.exit(0);
});

server.listen(8888);

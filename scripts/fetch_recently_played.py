import base64
import json
import os
import requests

CLIENT_ID = os.environ["SPOTIFY_CLIENT_ID"]
CLIENT_SECRET = os.environ["SPOTIFY_CLIENT_SECRET"]
REFRESH_TOKEN = os.environ["SPOTIFY_REFRESH_TOKEN"]

def get_access_token():
    credentials = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    response = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {credentials}"},
        data={
            "grant_type": "refresh_token",
            "refresh_token": REFRESH_TOKEN,
        },
    )
    response.raise_for_status()
    return response.json()["access_token"]

def fetch_recently_played(access_token):
    response = requests.get(
        "https://api.spotify.com/v1/me/player/recently-played",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"limit": 50},
    )
    response.raise_for_status()
    items = response.json()["items"]

    return [
        {
            "track": item["track"]["name"],
            "artist": ", ".join(a["name"] for a in item["track"]["artists"]),
            "album": item["track"]["album"]["name"],
            "album_art": item["track"]["album"]["images"][0]["url"],
            "url": item["track"]["external_urls"]["spotify"],
            "played_at": item["played_at"],
        }
        for item in items
    ]

if __name__ == "__main__":
    access_token = get_access_token()
    new_tracks = fetch_recently_played(access_token)

    os.makedirs("public/data", exist_ok=True)
    filepath = "public/data/recently-played.json"

    existing_tracks = []
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            existing_tracks = json.load(f)

    existing_played_ats = {t["played_at"] for t in existing_tracks}
    new_unique = [t for t in new_tracks if t["played_at"] not in existing_played_ats]
    merged = new_unique + existing_tracks

    with open(filepath, "w") as f:
        json.dump(merged, f, indent=2)

    print(f"Added {len(new_unique)} new tracks, {len(merged)} total")
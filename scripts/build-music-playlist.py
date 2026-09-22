"""Refresh the website playlist from the music folder before deployment."""
import json
from hashlib import sha256
from pathlib import Path
from urllib.parse import quote

root = Path(__file__).resolve().parents[1]
music = root / 'assets' / 'music'
extensions = {'.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac', '.webm'}
# Keep the chosen mix order when the deployment workflow rebuilds the playlist.
preferred_order = {'moonlight.mp3': 0, 'baby.mp3': 1, 'bullet.mp3': 2}
titles = {'moonlight': 'Moonlight', 'baby': 'B@BY', 'bullet': 'Bullet'}
tracks = [
    {'title': titles.get(song.stem.casefold(), song.stem.replace('_', ' ')),
     'src': f"{quote(song.relative_to(root).as_posix(), safe='/')}?v={sha256(song.read_bytes()).hexdigest()[:12]}"}
    for song in sorted(music.iterdir(), key=lambda path: (
        preferred_order.get(path.name.casefold(), len(preferred_order)),
        path.name.casefold(),
    ))
    if song.is_file() and song.suffix.lower() in extensions
]
(music / 'playlist.json').write_text(json.dumps(tracks, indent=2) + '\n')
print(f'Playlist ready: {len(tracks)} track(s)')

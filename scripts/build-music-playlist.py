"""Refresh the website playlist from the music folder before deployment."""
import json
from pathlib import Path
from urllib.parse import quote

root = Path(__file__).resolve().parents[1]
music = root / 'assets' / 'music'
extensions = {'.mp3', '.m4a', '.ogg', '.wav', '.aac', '.flac', '.webm'}
tracks = [
    {'title': 'B@BY' if song.stem == 'BABY' else song.stem.replace('_', ' '),
     'src': quote(song.relative_to(root).as_posix(), safe='/')}
    for song in sorted(music.iterdir(), key=lambda path: path.name.casefold())
    if song.is_file() and song.suffix.lower() in extensions
]
(music / 'playlist.json').write_text(json.dumps(tracks, indent=2) + '\n')
print(f'Playlist ready: {len(tracks)} track(s)')

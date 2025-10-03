import React from 'react';
import styles from './SpotifyPlaylist.module.css';

interface SpotifyPlaylistProps {
  playlistId: string;
  compact?: boolean;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
}

const SpotifyPlaylist: React.FC<SpotifyPlaylistProps> = ({
  playlistId,
  compact = false,
  theme = 'dark',
  width = '100%',
  height = compact ? 152 : 380
}) => {
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=${theme === 'dark' ? '0' : '1'}`;

  return (
    <div className={styles.spotifyContainer}>
      <iframe
        src={embedUrl}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Playlist"
      />
    </div>
  );
};

export default SpotifyPlaylist;
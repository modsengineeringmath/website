import React from 'react';
import styles from './YouTubeVideo.module.css';

type Props = {
  videoId: string;
  title: string;
  description?: string;
  playlist?: boolean;
};

export default function YouTubeVideo({
  videoId,
  title,
  description,
  playlist = false,
}: Props): React.JSX.Element {
  const src = playlist
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(videoId)}`
    : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      {description && <figcaption>{description}</figcaption>}
    </figure>
  );
}

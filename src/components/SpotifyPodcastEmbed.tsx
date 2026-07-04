import React from 'react';
import {
  SITE_SHELL_CARD,
  SITE_SHELL_SECTION,
  SITE_SHELL_TEXT_HIGHLIGHT,
  SITE_SHELL_TEXT_HIGHLIGHT_PANEL,
} from '../config/siteShell';

/** Show: Cryptomarketing — https://open.spotify.com/show/4NdvEKX1wIIlKMfckUSHui */
const DEFAULT_SHOW_ID = '4NdvEKX1wIIlKMfckUSHui';

export interface SpotifyPodcastEmbedProps {
  className?: string;
  showId?: string;
  heading?: string;
  description?: string;
}

const SpotifyPodcastEmbed: React.FC<SpotifyPodcastEmbedProps> = ({
  className = '',
  showId = DEFAULT_SHOW_ID,
  heading = 'Podcast Cryptomarketing',
  description = 'Cryptomarketing, Link4Deal y DameCódigo: escucha el show en Spotify sin salir del sitio.',
}) => {
  const src = `https://open.spotify.com/embed/show/${showId}?utm_source=generator&theme=0`;

  return (
    <section
      className={`${SITE_SHELL_SECTION} ${className}`.trim()}
      aria-label={heading}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full text-lg font-semibold mb-6">
            <span className="text-2xl" aria-hidden>
              🎧
            </span>
            Spotify
          </div>
          <div className={`${SITE_SHELL_TEXT_HIGHLIGHT_PANEL} px-6 py-5 sm:px-8`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className={SITE_SHELL_TEXT_HIGHLIGHT}>{heading}</span>
            </h2>
            <p className="text-lg leading-relaxed">
              <span className={SITE_SHELL_TEXT_HIGHLIGHT}>{description}</span>
            </p>
          </div>
        </div>

        <div className={`rounded-2xl overflow-hidden shadow-xl border border-white/10 ${SITE_SHELL_CARD}`}>
          <iframe
            title={`${heading} — reproductor embebido de Spotify`}
            src={src}
            width="100%"
            height="352"
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full bg-black"
            style={{ minHeight: 352 }}
          />
        </div>
      </div>
    </section>
  );
};

export default SpotifyPodcastEmbed;

import React from 'react';

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
  const src = `https://open.spotify.com/embed/show/${showId}?utm_source=generator`;

  return (
    <section
      className={`py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50 ${className}`.trim()}
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{description}</p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
          <iframe
            title={`${heading} — reproductor embebido de Spotify`}
            src={src}
            width="100%"
            height="352"
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full"
            style={{ minHeight: 352 }}
          />
        </div>
      </div>
    </section>
  );
};

export default SpotifyPodcastEmbed;

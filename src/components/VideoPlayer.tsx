'use client';

import { useRef, useEffect } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';

// Import Video.js CSS
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/city/index.css';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export default function VideoPlayer({ src, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.classList.add('video-js', 'vjs-default-skin', 'vjs-big-play-centered');
      videoElement.setAttribute('controls', '');
      videoElement.setAttribute('preload', 'metadata');
      videoElement.setAttribute('data-setup', '{}');
      videoRef.current.appendChild(videoElement);

      try {
        const player = videojs(videoElement, {
          controls: true,
          responsive: true,
          fluid: true,
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          sources: [{
            src: src,
            type: getVideoType(src)
          }],
          techOrder: ['html5'],
          html5: {
            vhs: {
              overrideNative: false
            }
          }
        });

        playerRef.current = player;

        // Handle player ready
        player.ready(() => {
          console.log('Video.js player is ready');
        });

        // Handle errors
        player.on('error', () => {
          const error = player.error();
          console.error('Video.js error:', error);
        });
      } catch (error) {
        console.error('Failed to initialize Video.js player:', error);
      }
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (error) {
          console.error('Error disposing Video.js player:', error);
        }
      }
    };
  }, []);

  // Update source when src changes
  useEffect(() => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      playerRef.current.src({
        src: src,
        type: getVideoType(src)
      });
    }
  }, [src]);

  return (
    <div className={`video-player-wrapper ${className}`}>
      <div 
        ref={videoRef} 
        className="video-js-container"
        style={{ width: '80%', height: '80%' }}
      />
    </div>
  );
}

function getVideoType(src: string): string {
  const extension = src.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogg':
      return 'video/ogg';
    case 'mov':
      return 'video/quicktime';
    case 'avi':
      return 'video/x-msvideo';
    case 'mkv':
      return 'video/x-matroska';
    default:
      return 'video/mp4';
  }
}
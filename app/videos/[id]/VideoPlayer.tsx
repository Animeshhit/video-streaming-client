"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export default function VideoPlayer({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);

  useEffect(() => {
    if (!videoRef.current) return;

    const src = `http://localhost:8080/hls/${id}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
      });

      return () => hls.destroy();
    } else {
      videoRef.current.src = src;
    }
  }, [id]);

  const changeQuality = (level: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = level;
    setCurrentLevel(level);
  };

  return (
    <div>
      <video ref={videoRef} controls width={800} />

      <div style={{ marginTop: 10 }}>
        <button onClick={() => changeQuality(-1)}>
          Auto
        </button>

        {levels.map((l, i) => (
          <button key={i} onClick={() => changeQuality(i)}>
            {l.height}p
          </button>
        ))}
      </div>
    </div>
  );
}

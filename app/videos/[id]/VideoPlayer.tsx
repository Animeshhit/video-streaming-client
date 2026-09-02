"use client";

import { BACKENDURL } from "@/env";
import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";

type Level = {
  height?: number;
};

export default function VideoPlayer({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);

  const src = useMemo(
    () => `${BACKENDURL}/hls/${id}/master.m3u8`,
    [id],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hlsRef.current = hls;

      hls.attachMedia(video);
      hls.loadSource(src);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
      });

      return () => hls.destroy();
    } else {
      video.src = src;
    }
  }, [src]);
  const setQuality = (level: number) => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!hls || !video) return;

    const wasPaused = video.paused;
    const t = video.currentTime;

    // Auto
    if (level === -1) {
      hls.currentLevel = -1;
      hls.nextLevel = -1;
      setCurrentLevel(-1);
      return;
    }

    // Smooth switch
    hls.nextLevel = level;
    setCurrentLevel(level);

    const onSwitched = () => {
      // re-sync time if needed
      if (Math.abs(video.currentTime - t) > 0.5) video.currentTime = t;
      if (!wasPaused) video.play().catch(() => {});
      hls.off(Hls.Events.LEVEL_SWITCHED, onSwitched);
    };

    hls.on(Hls.Events.LEVEL_SWITCHED, onSwitched);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        display: "grid",
        placeItems: "center",
        padding: 24,
        color: "white",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 1100,
        }}
      >
        {/* Video */}
        <div
          style={{
            position: "relative",
            aspectRatio: "16 / 9",
            background: "black",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <video
            ref={videoRef}
            controls
            playsInline
            style={{
              width: "100%",
              height: "100%",
              background: "black",
            }}
          />
        </div>

        {/* Controls */}
        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Left */}
          <div
            style={{
              fontSize: 13,
              opacity: 0.7,
            }}
          >
            Adaptive streaming (HLS)
          </div>

          {/* Quality */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, opacity: 0.7 }}>Quality</span>

            <button
              onClick={() => setQuality(-1)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                background: currentLevel === -1 ? "white" : "transparent",
                color: currentLevel === -1 ? "black" : "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Auto
            </button>

            {levels.map((l, i) => (
              <button
                key={i}
                onClick={() => setQuality(i)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: currentLevel === i ? "white" : "transparent",
                  color: currentLevel === i ? "black" : "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {l.height}p
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

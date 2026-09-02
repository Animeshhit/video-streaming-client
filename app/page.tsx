"use client";

import { useEffect, useRef, useState } from "react";

type Status = "IDLE" | "UPLOADING" | "PROCESSING" | "ERROR";
import { BACKENDURL } from "@/env";



const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // give up after 5 minutes

export default function UploadPage() {
  const [status, setStatus] = useState<Status>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the interval/timeout so we can clear them on unmount or completion
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any in-flight polling if the component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    setStatus("UPLOADING");
    setErrorMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("video", file);

      const res = await fetch(`${BACKENDURL}/api/videos/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Upload failed (${res.status}): ${text || res.statusText}`
        );
      }

      const data = await res.json();

      if (!data?.id) {
        throw new Error("Upload succeeded but no video id was returned.");
      }

      setStatus("PROCESSING");
      pollStatus(data.id);
    } catch (err) {
      console.error("[UPLOAD] failed:", err);
      setStatus("ERROR");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong during upload."
      );
    }
  }

  function pollStatus(id: string) {
    stopPolling(); // just in case one is already running

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKENDURL}/api/videos/${id}/status`);

        if (!res.ok) {
          throw new Error(`Status check failed (${res.status})`);
        }

        const data = await res.json();

        if (data.status === "READY") {
          stopPolling();
          window.location.href = `/videos/${id}`;
        }
        // if status is still PROCESSING, keep polling silently
      } catch (err) {
        console.error("[POLL] failed:", err);
        stopPolling();
        setStatus("ERROR");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Lost connection while checking video status."
        );
      }
    }, POLL_INTERVAL_MS);

    // Give up after POLL_TIMEOUT_MS so the UI never hangs forever
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setStatus("ERROR");
      setErrorMessage(
        "Processing is taking longer than expected. Please check back later."
      );
    }, POLL_TIMEOUT_MS);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  }

  function openFileDialog() {
    fileInputRef.current?.click();
  }

  function onDropzoneKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFileDialog();
    }
  }

  const isBusy = status === "UPLOADING" || status === "PROCESSING";

  return (
    <div style={styles.wrapper}>
      {/* Blurred background layer */}
      <div style={styles.background} />

      {/* Foreground */}
      <div style={styles.page}>
        <form onSubmit={handleSubmit} style={styles.card}>
          <h1 style={styles.heading}>Upload Video</h1>

          {/* Dropzone */}
          <div
            style={styles.dropzone}
            role="button"
            tabIndex={0}
            aria-label="Choose or drop a video file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={openFileDialog}
            onKeyDown={onDropzoneKeyDown}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="video"
              accept="video/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {file ? (
              <p style={styles.fileName}>{file.name}</p>
            ) : (
              <>
                <p style={styles.dropText}>Drag & drop video here</p>
                <p style={styles.subText}>or click to browse</p>
              </>
            )}
          </div>

          {/* Title */}
          <input
            type="text"
            name="title"
            placeholder="Video title"
            required
            style={styles.input}
          />

          {/* Button */}
          <button
            type="submit"
            disabled={isBusy}
            style={{
              ...styles.button,
              opacity: isBusy ? 0.6 : 1,
              cursor: isBusy ? "not-allowed" : "pointer",
            }}
          >
            Upload
          </button>

          {/* Status */}
          {status === "UPLOADING" && (
            <p style={styles.status}>Uploading…</p>
          )}
          {status === "PROCESSING" && (
            <p style={styles.status}>Processing video…</p>
          )}
          {status === "ERROR" && (
            <p style={{ ...styles.status, ...styles.errorStatus }}>
              {errorMessage || "Something went wrong."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
  },

  background: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, #111 0%, #000 100%)",
    filter: "blur(20px)",
    transform: "scale(1.1)",
  },

  page: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },

  card: {
    width: 420,
    background: "#fff",
    padding: 32,
    border: "1px solid #000",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
  },

  heading: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    color: "#000",
  },

  dropzone: {
    border: "2px dashed #000",
    padding: 40,
    textAlign: "center",
    cursor: "pointer",
    background: "#fafafa",
  },

  dropText: {
    fontSize: 16,
    fontWeight: 600,
    color: "#000",
  },

  subText: {
    fontSize: 12,
    opacity: 0.6,
  },

  fileName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#000",
    padding: "8px 12px",
    border: "1px solid #000",
    display: "inline-block",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    background: "#fff",
  },

  input: {
    padding: 12,
    fontSize: 14,
    border: "1px solid #000",
    outline: "none",
    color: "black",
  },

  button: {
    padding: 14,
    background: "#000",
    color: "#fff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
  },

  status: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    borderTop: "1px solid #000",
    paddingTop: 12,
    marginTop: 8,
    color: "#000",
  },

  errorStatus: {
    color: "#b00020",
    borderTop: "1px solid #b00020",
  },
};
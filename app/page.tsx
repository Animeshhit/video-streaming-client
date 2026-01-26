"use client";

import { useRef, useState } from "react";

type Status = "IDLE" | "UPLOADING" | "PROCESSING";

export default function UploadPage() {
  const [status, setStatus] = useState<Status>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    setStatus("UPLOADING");

    const formData = new FormData(e.currentTarget);
    formData.set("video", file);

    const res = await fetch("http://localhost:8080/api/videos/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setStatus("PROCESSING");
    pollStatus(data.id);
  }

  function pollStatus(id: string) {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:8080/api/videos/${id}/status`);
      const data = await res.json();

      if (data.status === "READY") {
        clearInterval(interval);
        window.location.href = `/videos/${id}`;
      }
    }, 2000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  }

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
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
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
            disabled={status !== "IDLE"}
            style={{
              ...styles.button,
              opacity: status === "IDLE" ? 1 : 0.6,
              cursor: status === "IDLE" ? "pointer" : "not-allowed",
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
    color:"black"
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

};

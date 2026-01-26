"use client";

import { useState } from "react";

export default function UploadPage() {
  const [status, setStatus] = useState<"IDLE" | "UPLOADING" | "PROCESSING">("IDLE");
  const [videoId, setVideoId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("UPLOADING");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("http://localhost:8080/api/videos/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setVideoId(data.id);
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

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="video" required />
      <input type="text" name="title" required />
      <button>Upload</button>

      {status === "UPLOADING" && <p>Uploading…</p>}
      {status === "PROCESSING" && <p>Processing video…</p>}
    </form>
  );
}

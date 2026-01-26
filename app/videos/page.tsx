import Link from "next/link";
import Image from "next/image";

type Video = {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string; // optional
  duration?: number; // optional (seconds)
  createdAt?: string; // optional ISO string
};

async function getVideos(): Promise<Video[]> {
  const res = await fetch("http://localhost:8080/api/videos", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch videos: ${res.status}`);
  }

  return res.json();
}

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

export default async function Page() {
  const videos = await getVideos();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: 0 }}>
            Videos
          </h1>
          <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
            Browse the latest uploads ({videos?.length ?? 0})
          </p>
        </div>

        <Link
          href="/videos/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          + Add video
        </Link>
      </header>

      {/* Search UI (visual only; wire up later if you want) */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Search videos…"
          aria-label="Search videos"
          style={{
            flex: "1 1 260px",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            outline: "none",
          }}
        />
        <select
          aria-label="Sort videos"
          defaultValue="newest"
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "transparent",
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title</option>
        </select>
      </div>

      {(!videos || videos.length === 0) && (
        <section
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>No videos yet</h2>
          <p style={{ margin: "8px 0 14px", opacity: 0.75 }}>
            Upload your first video to see it listed here.
          </p>
          <Link
            href="/videos/new"
            style={{
              display: "inline-flex",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Upload a video
          </Link>
        </section>
      )}

      {videos?.length > 0 && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {videos.map((v) => {
            const dur = formatDuration(v.duration);
            const date = formatDate(v.createdAt);

            return (
              <Link
                key={v._id}
                href={`/videos/${v._id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <article
                  style={{
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 18,
                    overflow: "hidden",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                    background: "rgba(255,255,255,0.6)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "16 / 9",
                      background:
                        "linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))",
                    }}
                  >
                    {v.thumbnailUrl ? (
                      <Image
                        src={v.thumbnailUrl}
                        alt={v.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          opacity: 0.6,
                        }}
                      >
                        No thumbnail
                      </div>
                    )}

                    {(dur || date) && (
                      <div
                        style={{
                          position: "absolute",
                          left: 10,
                          bottom: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {dur && (
                          <span
                            style={{
                              fontSize: 12,
                              padding: "4px 8px",
                              borderRadius: 999,
                              background: "rgba(0,0,0,0.6)",
                              color: "white",
                            }}
                          >
                            {dur}
                          </span>
                        )}
                        {date && (
                          <span
                            style={{
                              fontSize: 12,
                              padding: "4px 8px",
                              borderRadius: 999,
                              background: "rgba(0,0,0,0.6)",
                              color: "white",
                            }}
                          >
                            {date}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 14 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 16,
                        lineHeight: 1.25,
                      }}
                    >
                      {v.title}
                    </h2>

                    {v.description && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          opacity: 0.75,
                          fontSize: 13,
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {v.description}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: 0.8,
                        fontSize: 12,
                      }}
                    >
                      <span>View details</span>
                      <span aria-hidden>→</span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}

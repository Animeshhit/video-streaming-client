import Link from "next/link";

async function getVideos() {
  const res = await fetch("http://localhost:8080/api/videos", {
    cache: "no-store",
  });
  return res.json();
}

export default async function Page() {
  const videos = await getVideos();

  return (
    <ul>
      {videos.map((v: any) => (
        <li key={v._id}>
          <Link href={`/videos/${v._id}`}>{v.title}</Link>
        </li>
      ))}
    </ul>
  );
}

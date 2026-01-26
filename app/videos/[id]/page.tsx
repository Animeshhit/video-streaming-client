import VideoPlayer from "./VideoPlayer";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  let {id} = await params;
  return <VideoPlayer id={id} />;
}

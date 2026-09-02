import VideoPlayer from "./VideoPlayer";

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  let {id} = await params;
  return <VideoPlayer id={id} />;
}

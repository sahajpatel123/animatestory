import Player from '@/components/Player'

export default function WatchPage({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Watch</h1>
      <Player projectId={params.id} />
    </main>
  )
}



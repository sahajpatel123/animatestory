import SceneBoard from '@/components/SceneBoard'

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Project {params.id}</h1>
      <SceneBoard projectId={params.id} />
    </main>
  )
}



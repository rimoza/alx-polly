import PollPageWithRealtime from './components/PollPageWithRealtime'

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Render the new real-time poll page that demonstrates React 19 features
  return <PollPageWithRealtime pollId={id} />
}
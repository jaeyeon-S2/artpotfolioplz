import { getProfile } from '@/lib/local-db'
import { ProfileEditor } from './profile-editor'
import { Chatbot } from '@/components/chatbot'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="min-h-full p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">작가 프로필</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProfileEditor profile={profile} />
          <Chatbot />
        </div>
      </div>
    </div>
  )
}

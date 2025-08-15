import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ContestBrowser from "@/components/contest-browser"
import Dashboard from "@/components/dashboard"
import ProfileSettings from "@/components/profile-settings"
import Header from "@/components/header"

export default async function HomePage() {
  const supabase = createClient()

  let user = null
  let profile = null

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log("[v0] Auth error on homepage:", authError.message)
      redirect("/auth/login")
    }

    user = authUser

    // If no user, redirect to login
    if (!user) {
      redirect("/auth/login")
    }

    // Get user profile data with error handling
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.log("[v0] Profile fetch error:", profileError.message)
    }

    profile = profileData
  } catch (error) {
    console.log("[v0] Homepage error:", error)
    redirect("/auth/login")
  }

  const handleProfileUpdate = async (updatedProfile: any) => {
    // This will be handled client-side in the ProfileSettings component
    console.log("[v0] Profile updated:", updatedProfile)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CF Virtual Finder</h1>
          <p className="text-gray-400 text-lg">Find the perfect Codeforces contests for your practice sessions</p>
        </div>

        <Tabs defaultValue="contests" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="contests" className="data-[state=active]:bg-gray-800 text-gray-300">
              Browse Contests
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-800 text-gray-300">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-800 text-gray-300">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contests">
            <ContestBrowser userHandle={profile?.codeforces_handle} />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard userId={user.id} userHandle={profile?.codeforces_handle} />
          </TabsContent>

          <TabsContent value="settings">
            <ProfileSettings user={user} profile={profile} onProfileUpdate={handleProfileUpdate} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

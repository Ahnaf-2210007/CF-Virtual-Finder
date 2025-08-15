"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Save, User, ExternalLink, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ProfileSettingsProps {
  user: any
  profile: any
  onProfileUpdate: (profile: any) => void
}

export default function ProfileSettings({ user, profile, onProfileUpdate }: ProfileSettingsProps) {
  const [name, setName] = useState("")
  const [codeforcesHandle, setCodeforcesHandle] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] Profile data received:", { user, profile })
    if (profile) {
      setName(profile.name || "")
      setCodeforcesHandle(profile.codeforces_handle || "")
    }
    setInitialLoading(false)
  }, [profile])

  const handleSave = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      console.log("[v0] Saving profile data:", { name: name.trim(), codeforces_handle: codeforcesHandle.trim() })

      const { data, error } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          codeforces_handle: codeforcesHandle.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        console.error("[v0] Profile update error:", error)
        throw error
      }

      console.log("[v0] Profile updated successfully:", data)
      onProfileUpdate(data)
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Settings
            </CardTitle>
            <CardDescription className="text-gray-400">Loading profile data...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-20" />
                  <div className="h-10 bg-gray-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage your account information and Codeforces integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-400"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <Separator className="bg-gray-800" />

          {/* Codeforces Integration */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Codeforces Integration</h3>
              <p className="text-sm text-gray-400 mb-4">
                Connect your Codeforces handle to get personalized contest recommendations and track your progress.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeforces_handle" className="text-gray-300">
                Codeforces Handle
              </Label>
              <Input
                id="codeforces_handle"
                value={codeforcesHandle}
                onChange={(e) => setCodeforcesHandle(e.target.value)}
                placeholder="your_cf_handle"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                This will be used to fetch your contest history and filter solved contests
              </p>
            </div>

            {codeforcesHandle && (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  <a
                    href={`https://codeforces.com/profile/${codeforcesHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View CF Profile
                  </a>
                </Button>
              </div>
            )}
          </div>

          <Separator className="bg-gray-800" />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Trophy, Target, Clock, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DashboardProps {
  userId: string
  userHandle?: string
}

interface UserStats {
  totalTracked: number
  completed: number
  attempted: number
  planned: number
  totalTimeSpent: number
  averageProblemsPerContest: number
  favoriteContests: number
}

interface ContestTracking {
  id: string
  contest_id: number
  contest_name: string
  status: string
  problems_solved: number
  total_problems: number
  time_spent_minutes: number
  attempted_at?: string
  completed_at?: string
}

export default function Dashboard({ userId, userHandle }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ContestTracking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()

      // Fetch user contest tracking data
      const { data: trackingData } = await supabase
        .from("user_contest_tracking")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })

      // Fetch favorite contests count
      const { data: favoritesData } = await supabase.from("user_favorite_contests").select("id").eq("user_id", userId)

      if (trackingData) {
        // Calculate stats
        const totalTracked = trackingData.length
        const completed = trackingData.filter((t) => t.status === "completed").length
        const attempted = trackingData.filter((t) => t.status === "attempted").length
        const planned = trackingData.filter((t) => t.status === "planned").length
        const totalTimeSpent = trackingData.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0)
        const totalProblems = trackingData.reduce((sum, t) => sum + (t.problems_solved || 0), 0)
        const averageProblemsPerContest = totalTracked > 0 ? Math.round(totalProblems / totalTracked) : 0

        setStats({
          totalTracked,
          completed,
          attempted,
          planned,
          totalTimeSpent,
          averageProblemsPerContest,
          favoriteContests: favoritesData?.length || 0,
        })

        setRecentActivity(trackingData.slice(0, 10))
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "attempted":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "planned":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "skipped":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-800 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-800 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">No tracking data yet</h3>
        <p className="text-gray-500">Start tracking contests to see your progress here.</p>
      </div>
    )
  }

  const completionRate = stats.totalTracked > 0 ? Math.round((stats.completed / stats.totalTracked) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Tracked</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTracked}</div>
            <p className="text-xs text-gray-500">contests in your list</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completed}</div>
            <p className="text-xs text-gray-500">{completionRate}% completion rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Math.round(stats.totalTimeSpent / 60)}h</div>
            <p className="text-xs text-gray-500">{stats.totalTimeSpent} minutes total</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Problems</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.averageProblemsPerContest}</div>
            <p className="text-xs text-gray-500">per contest</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Progress Overview</CardTitle>
          <CardDescription className="text-gray-400">Your contest completion progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Overall Completion</span>
              <span className="text-white">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="bg-gray-800" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400">{stats.completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-400">{stats.attempted}</div>
              <div className="text-xs text-gray-500">Attempted</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-400">{stats.planned}</div>
              <div className="text-xs text-gray-500">Planned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-400">{stats.favoriteContests}</div>
              <div className="text-xs text-gray-500">Favorites</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-gray-400">Your latest contest interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{activity.contest_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor(activity.status)} border text-xs`}>{activity.status}</Badge>
                      {activity.problems_solved > 0 && (
                        <span className="text-xs text-gray-400">{activity.problems_solved} problems solved</span>
                      )}
                      {activity.time_spent_minutes > 0 && (
                        <span className="text-xs text-gray-400">{activity.time_spent_minutes}min</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">#{activity.contest_id}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

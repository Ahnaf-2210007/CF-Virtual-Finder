"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BarChart, Trophy, Target, TrendingUp, Star, Award, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getUserContestStats,
  getSubmissionHeatmapData,
  getUserInfo,
  getProblemStatistics,
  getRatingColor,
} from "@/lib/codeforces-api"
import SubmissionHeatmap from "./submission-heatmap"
import ProblemStatisticsCharts from "./problem-statistics-charts"
import VirtualContestTracker from "./virtual-contest-tracker"

interface DashboardProps {
  userId: string
  userHandle?: string
}

interface UserStats {
  totalTracked: number
  completed: number
  attempted: number
  planned: number
  favoriteContests: number
}

interface CodeforcesStats {
  totalContests: number
  bestRank: number
  averageRank: number
  ratingChange: number
  maxRating: number
  currentRating: number
  rank: string
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
  is_favorite?: boolean
}

interface ProblemStats {
  totalSolved: number
  ratingDistribution: { [rating: string]: number }
  topicDistribution: { [topic: string]: number }
}

export default function Dashboard({ userId, userHandle }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(null)
  const [problemStats, setProblemStats] = useState<ProblemStats | null>(null)
  const [heatmapData, setHeatmapData] = useState<{ [date: string]: number }>({})
  const [recentActivity, setRecentActivity] = useState<ContestTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [cfLoading, setCfLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const toggleFavorite = (contestId: number, contestName: string) => {
    // Placeholder for toggleFavorite logic
    console.log(`Toggle favorite for contest ${contestId}: ${contestName}`)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  useEffect(() => {
    if (userHandle) {
      fetchCodeforcesData()
    }
  }, [userHandle])

  useEffect(() => {
    if (!userHandle || !autoRefresh) return

    const interval = setInterval(
      () => {
        console.log("[v0] Auto-refreshing Codeforces data...")
        fetchCodeforcesData()
      },
      5 * 60 * 1000,
    ) // Refresh every 5 minutes

    return () => clearInterval(interval)
  }, [userHandle, autoRefresh])

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

        setStats({
          totalTracked,
          completed,
          attempted,
          planned,
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

  const fetchCodeforcesData = async () => {
    if (!userHandle) return

    try {
      setCfLoading(true)
      console.log("[v0] Fetching CF data for handle:", userHandle)

      const [contestStats, heatmap, userInfo, problemStatistics] = await Promise.all([
        getUserContestStats(userHandle),
        getSubmissionHeatmapData(userHandle),
        getUserInfo([userHandle]),
        getProblemStatistics(userHandle),
      ])

      console.log("[v0] CF data fetched successfully:", { contestStats, userInfo: userInfo[0], problemStatistics })

      setCfStats({
        ...contestStats,
        rank: userInfo[0]?.rank || "unrated",
      })
      setHeatmapData(heatmap)
      setProblemStats(problemStatistics)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching Codeforces data:", error)
    } finally {
      setCfLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    if (userHandle) {
      await fetchCodeforcesData()
    }
    await fetchDashboardData()
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
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
      {userHandle && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleManualRefresh}
                  disabled={cfLoading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {cfLoading ? "Refreshing..." : "Refresh Data"}
                </Button>
                <Button
                  onClick={toggleAutoRefresh}
                  variant="outline"
                  size="sm"
                  className={`${autoRefresh ? "bg-green-600/20 border-green-600 text-green-400" : "bg-gray-600/20 border-gray-600 text-gray-400"}`}
                >
                  Auto-refresh: {autoRefresh ? "ON" : "OFF"}
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : "Never updated"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userHandle && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Current Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${cfLoading ? "text-white animate-pulse" : getRatingColor(cfStats?.currentRating || 0)}`}
              >
                {cfLoading ? "..." : cfStats?.currentRating || 0}
              </div>
              <p className={`text-xs ${cfStats ? getRatingColor(cfStats.currentRating) : "text-gray-500"}`}>
                {cfLoading ? "Loading..." : cfStats?.rank || "unrated"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Max Rating</CardTitle>
              <Award className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${cfLoading ? "text-white animate-pulse" : getRatingColor(cfStats?.maxRating || 0)}`}
              >
                {cfLoading ? "..." : cfStats?.maxRating || 0}
              </div>
              <p className="text-xs text-gray-500">
                {cfLoading ? "Loading..." : `+${cfStats?.ratingChange || 0} total change`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Contests</CardTitle>
              <Trophy className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cfLoading ? "text-white animate-pulse" : "text-white"}`}>
                {cfLoading ? "..." : cfStats?.totalContests || 0}
              </div>
              <p className="text-xs text-gray-500">
                {cfLoading ? "Loading..." : `Best rank: #${cfStats?.bestRank || 0}`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Rank</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cfLoading ? "text-white animate-pulse" : "text-white"}`}>
                #{cfLoading ? "..." : cfStats?.averageRank || 0}
              </div>
              <p className="text-xs text-gray-500">across all contests</p>
            </CardContent>
          </Card>
        </div>
      )}

      {userHandle && <SubmissionHeatmap heatmapData={heatmapData} loading={cfLoading} />}

      {userHandle && problemStats && (
        <ProblemStatisticsCharts
          totalSolved={problemStats.totalSolved}
          ratingDistribution={problemStats.ratingDistribution}
          topicDistribution={problemStats.topicDistribution}
          loading={cfLoading}
        />
      )}

      <VirtualContestTracker userId={userId} userHandle={userHandle} />

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
            <CardTitle className="text-sm font-medium text-gray-400">Attempted</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.attempted}</div>
            <p className="text-xs text-gray-500">in progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Favorites</CardTitle>
            <Star className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.favoriteContests}</div>
            <p className="text-xs text-gray-500">saved contests</p>
          </CardContent>
        </Card>
      </div>

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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(activity.contest_id, activity.contest_name)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Heart className={`h-4 w-4 ${activity.is_favorite ? "fill-red-400 text-red-400" : ""}`} />
                    </Button>
                    <div className="text-xs text-gray-500">#{activity.contest_id}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

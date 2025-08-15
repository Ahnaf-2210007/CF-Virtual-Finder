"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ExternalLink, Trophy, Heart, Plus } from "lucide-react"
import { type Contest, getContestDifficulty } from "@/lib/codeforces-api"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ContestCardProps {
  contest: Contest
  userHandle?: string
}

export default function ContestCard({ contest, userHandle }: ContestCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToList, setIsAddingToList] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const difficulty = getContestDifficulty(contest)
  const startDate = contest.startTimeSeconds ? new Date(contest.startTimeSeconds * 1000) : null
  const duration = contest.durationSeconds ? Math.floor(contest.durationSeconds / 3600) : null

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Hard":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CF":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "IOI":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "ICPC":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const handleFavorite = async () => {
    if (!userHandle) {
      toast({
        title: "Login Required",
        description: "Please login to add favorites",
        variant: "destructive",
      })
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      if (isFavorite) {
        // Remove from favorites
        await supabase.from("contest_favorites").delete().eq("user_id", user.id).eq("contest_id", contest.id)

        setIsFavorite(false)
        toast({
          title: "Removed from favorites",
          description: `${contest.name} removed from your favorites`,
        })
      } else {
        // Add to favorites
        await supabase.from("contest_favorites").insert({
          user_id: user.id,
          contest_id: contest.id,
          contest_name: contest.name,
          contest_type: contest.type,
        })

        setIsFavorite(true)
        toast({
          title: "Added to favorites",
          description: `${contest.name} added to your favorites`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      })
    }
  }

  const handleAddToList = async () => {
    if (!userHandle) {
      toast({
        title: "Login Required",
        description: "Please login to track contests",
        variant: "destructive",
      })
      return
    }

    setIsAddingToList(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("virtual_contests").insert({
        user_id: user.id,
        contest_id: contest.id,
        contest_name: contest.name,
        problems_solved: 0,
        total_problems: 0, // Will be updated when user provides details
        status: "planned",
      })

      toast({
        title: "Added to your list",
        description: `${contest.name} added to your contest tracking list`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add contest to list",
        variant: "destructive",
      })
    } finally {
      setIsAddingToList(false)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-lg leading-tight line-clamp-2">{contest.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getTypeColor(contest.type)} border`}>{contest.type}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={`p-1 h-8 w-8 ${isFavorite ? "text-red-400 hover:text-red-300" : "text-gray-400 hover:text-red-400"}`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={`${getDifficultyColor(difficulty)} border`}>{difficulty}</Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            #{contest.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          {startDate && (
            <div className="flex items-center text-gray-400">
              <Calendar className="h-4 w-4 mr-2" />
              {startDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          )}

          {duration && (
            <div className="flex items-center text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              {duration} hours
            </div>
          )}

          <div className="flex items-center text-gray-400">
            <Trophy className="h-4 w-4 mr-2" />
            {contest.phase}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
            <a href={`https://codeforces.com/contest/${contest.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Contest
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            size="sm"
          >
            <a href={`https://codeforces.com/contest/${contest.id}/virtual`} target="_blank" rel="noopener noreferrer">
              Virtual
            </a>
          </Button>

          <Button
            onClick={handleAddToList}
            disabled={isAddingToList}
            variant="outline"
            className="border-green-700 text-green-300 hover:bg-green-800 bg-transparent"
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

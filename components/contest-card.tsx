"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ExternalLink, Trophy } from "lucide-react"
import { type Contest, getContestDifficulty } from "@/lib/codeforces-api"

interface ContestCardProps {
  contest: Contest
}

export default function ContestCard({ contest }: ContestCardProps) {
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

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-lg leading-tight line-clamp-2">{contest.name}</CardTitle>
          <Badge className={`ml-2 ${getTypeColor(contest.type)} border`}>{contest.type}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={`${getDifficultyColor(difficulty)} border`}>{difficulty}</Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            #{contest.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contest Details */}
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
        </div>
      </CardContent>
    </Card>
  )
}

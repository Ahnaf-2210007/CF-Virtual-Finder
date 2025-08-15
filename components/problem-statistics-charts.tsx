"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"

const TOPIC_COLORS = [
  "#FF6B6B",
  "#FF8E8E",
  "#A78BFA",
  "#8B5CF6",
  "#60A5FA",
  "#38BDF8",
  "#06B6D4",
  "#10B981",
  "#34D399",
  "#84CC16",
  "#FDE047",
  "#FACC15",
  "#FB923C",
  "#F97316",
  "#EC4899",
  "#F472B6",
]

interface ProblemStatisticsChartsProps {
  totalSolved: number
  ratingDistribution: { [rating: string]: number }
  topicDistribution: { [topic: string]: number }
  loading?: boolean
}

export default function ProblemStatisticsCharts({
  totalSolved,
  ratingDistribution,
  topicDistribution,
  loading,
}: ProblemStatisticsChartsProps) {
  console.log("[v0] ProblemStatisticsCharts received data:", {
    totalSolved,
    ratingDistribution,
    topicDistribution,
    loading,
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="h-4 bg-gray-800 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-16 bg-gray-800 rounded animate-pulse" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="h-4 bg-gray-800 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-800 rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="h-4 bg-gray-800 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-800 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const ratingData = [
    { rating: "800", count: ratingDistribution["800"] || 0, color: "#808080" },
    { rating: "900", count: ratingDistribution["900"] || 0, color: "#808080" },
    { rating: "1000", count: ratingDistribution["1000"] || 0, color: "#808080" },
    { rating: "1100", count: ratingDistribution["1100"] || 0, color: "#808080" },
    { rating: "1200", count: ratingDistribution["1200"] || 0, color: "#00AA00" },
    { rating: "1300", count: ratingDistribution["1300"] || 0, color: "#00AA00" },
    { rating: "1400", count: ratingDistribution["1400"] || 0, color: "#77DDBB" },
    { rating: "1500", count: ratingDistribution["1500"] || 0, color: "#77DDBB" },
    { rating: "1600", count: ratingDistribution["1600"] || 0, color: "#AAAAFF" },
    { rating: "1700", count: ratingDistribution["1700"] || 0, color: "#AAAAFF" },
    { rating: "1800", count: ratingDistribution["1800"] || 0, color: "#FFCC88" },
    { rating: "1900", count: ratingDistribution["1900"] || 0, color: "#FFCC88" },
    { rating: "2000", count: ratingDistribution["2000"] || 0, color: "#FF8888" },
    { rating: "2100", count: ratingDistribution["2100"] || 0, color: "#FF8888" },
    { rating: "2300", count: ratingDistribution["2300"] || 0, color: "#FF8888" },
    { rating: "2400", count: ratingDistribution["2400"] || 0, color: "#FF8888" },
    { rating: "2500", count: ratingDistribution["2500"] || 0, color: "#FF8888" },
    { rating: "2600", count: ratingDistribution["2600"] || 0, color: "#FF8888" },
  ].filter((d) => d.count > 0)

  const topicData = Object.entries(topicDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([topic, count], index) => ({
      topic,
      count,
      color: TOPIC_COLORS[index % TOPIC_COLORS.length],
    }))

  const maxRatingCount = Math.max(...ratingData.map((d) => d.count))
  const totalTopicCount = topicData.reduce((sum, d) => sum + d.count, 0)

  console.log("[v0] Custom charts data:", {
    ratingDataLength: ratingData.length,
    topicDataLength: topicData.length,
    maxRatingCount,
    totalTopicCount,
  })

  console.log(
    "[v0] Bar height calculations:",
    ratingData.map((item) => ({
      rating: item.rating,
      count: item.count,
      heightPercent: maxRatingCount > 0 && item.count > 0 ? Math.max((item.count / maxRatingCount) * 85 + 5, 8) : 0,
      heightPixels: maxRatingCount > 0 && item.count > 0 ? Math.max((item.count / maxRatingCount) * 250 + 20, 20) : 0,
    })),
  )

  return (
    <div className="space-y-6">
      {/* Total Problems Solved */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Problems Solved</CardTitle>
          <Target className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalSolved}</div>
          <p className="text-xs text-gray-500">across all contests and practice</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Problem Ratings</CardTitle>
            <CardDescription className="text-gray-400">
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-3 bg-gray-500 rounded-sm"></span>
                Problems Solved
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-800 rounded p-4">
              <div className="h-full flex items-end justify-between gap-1" style={{ height: "280px" }}>
                {ratingData.map((item) => {
                  const heightPixels =
                    maxRatingCount > 0 && item.count > 0 ? Math.max((item.count / maxRatingCount) * 250 + 20, 20) : 0

                  return (
                    <div key={item.rating} className="flex flex-col items-center gap-2 flex-1 min-w-[20px]">
                      <div className="text-xs text-gray-400 font-mono">{item.count}</div>
                      <div
                        className="w-full min-w-[16px] rounded-t transition-all duration-300 hover:opacity-80 border border-gray-700"
                        style={{
                          backgroundColor: item.color,
                          height: `${heightPixels}px`,
                          minHeight: item.count > 0 ? "20px" : "0px",
                        }}
                        title={`Rating ${item.rating}: ${item.count} problems`}
                      />
                      <div className="text-xs text-gray-400 font-mono transform -rotate-45 origin-center whitespace-nowrap">
                        {item.rating}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Tags Solved</CardTitle>
            <CardDescription className="text-gray-400">Problem categories distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 h-80">
              {/* Custom Donut Chart */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {topicData.map((item, index) => {
                      const percentage = (item.count / totalTopicCount) * 100
                      const circumference = 2 * Math.PI * 35 // radius = 35
                      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                      const strokeDashoffset = -topicData
                        .slice(0, index)
                        .reduce((sum, d) => sum + (d.count / totalTopicCount) * circumference, 0)

                      return (
                        <circle
                          key={item.topic}
                          cx="50"
                          cy="50"
                          r="35"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="8"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="hover:stroke-width-10 transition-all duration-200"
                        />
                      )
                    })}
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-1 max-h-80 overflow-y-auto pr-2">
                {topicData.map((entry) => (
                  <div key={entry.topic} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-300 truncate">
                      {entry.topic} : {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

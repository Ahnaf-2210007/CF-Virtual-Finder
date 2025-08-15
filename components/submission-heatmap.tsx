"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SubmissionHeatmapProps {
  heatmapData: { [date: string]: number }
  userHandle?: string
  userRegistrationYear?: number
  loading?: boolean
}

export default function SubmissionHeatmap({
  heatmapData,
  userHandle,
  userRegistrationYear,
  loading,
}: SubmissionHeatmapProps) {
  console.log("[v0] SubmissionHeatmap received data:", {
    heatmapDataKeys: Object.keys(heatmapData).length,
    heatmapDataSample: Object.entries(heatmapData).slice(0, 5),
    userHandle,
    userRegistrationYear,
    loading,
  })

  const currentYear = new Date().getFullYear()
  const startYear = userRegistrationYear || currentYear - 2
  const [selectedYear, setSelectedYear] = useState<number | null>(null) // null means rolling 12 months
  const [displayData, setDisplayData] = useState<{ [date: string]: number }>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedYear === null) {
      // Use rolling 12 months data directly
      console.log("[v0] Setting displayData to heatmapData:", {
        heatmapDataEntries: Object.keys(heatmapData).length,
        sampleData: Object.entries(heatmapData).slice(0, 3),
      })
      setDisplayData(heatmapData)
    } else {
      // Filter for specific year
      const yearFilteredData: { [date: string]: number } = {}
      Object.entries(heatmapData).forEach(([date, count]) => {
        const dateYear = new Date(date).getFullYear()
        if (dateYear === selectedYear) {
          yearFilteredData[date] = count
        }
      })
      console.log("[v0] Filtered year data:", {
        selectedYear,
        filteredEntries: Object.keys(yearFilteredData).length,
        sampleData: Object.entries(yearFilteredData).slice(0, 3),
      })
      setDisplayData(yearFilteredData)
    }
  }, [selectedYear, heatmapData, userHandle])

  const generateMonthlyData = () => {
    const today = new Date()
    const months = []

    if (selectedYear === null) {
      // Rolling 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today)
        monthDate.setMonth(monthDate.getMonth() - i)
        monthDate.setDate(1) // First day of month

        const year = monthDate.getFullYear()
        const month = monthDate.getMonth()
        const monthName = monthDate.toLocaleDateString("en", { month: "short" })

        // Get all dates in this month
        const monthDates = []
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day)
          monthDates.push(date.toISOString().split("T")[0])
        }

        months.push({
          name: monthName,
          year,
          month,
          dates: monthDates,
        })
      }
    } else {
      // Specific year - show all 12 months
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(selectedYear, month, 1)
        const monthName = monthDate.toLocaleDateString("en", { month: "short" })

        const monthDates = []
        const daysInMonth = new Date(selectedYear, month + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(selectedYear, month, day)
          monthDates.push(date.toISOString().split("T")[0])
        }

        months.push({
          name: monthName,
          year: selectedYear,
          month,
          dates: monthDates,
        })
      }
    }

    return months
  }

  const monthlyData = generateMonthlyData()
  const maxSubmissions = Math.max(...Object.values(displayData), 1)

  const getIntensity = (count: number) => {
    if (count === 0) return 0
    if (count <= maxSubmissions * 0.25) return 1
    if (count <= maxSubmissions * 0.5) return 2
    if (count <= maxSubmissions * 0.75) return 3
    return 4
  }

  const getColor = (intensity: number) => {
    const colors = [
      "bg-gray-800", // 0 submissions - dark background
      "bg-green-900", // very low activity - darker green
      "bg-green-700", // low activity - medium green
      "bg-green-500", // medium activity - bright green
      "bg-green-300", // high activity - very bright green
    ]
    return colors[intensity]
  }

  const calculateStatistics = () => {
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const dataSource = selectedYear === null ? heatmapData : displayData

    // All time stats - use all available data
    const allTimeTotal = Object.values(dataSource).reduce((sum, count) => sum + count, 0)

    // Last year stats
    const lastYearData = Object.entries(dataSource).filter(([date]) => {
      const dateObj = new Date(date)
      return dateObj >= oneYearAgo && dateObj <= now
    })
    const lastYearTotal = lastYearData.reduce((sum, [, count]) => sum + count, 0)

    // Last month stats
    const lastMonthData = Object.entries(dataSource).filter(([date]) => {
      const dateObj = new Date(date)
      return dateObj >= oneMonthAgo && dateObj <= now
    })
    const lastMonthTotal = lastMonthData.reduce((sum, [, count]) => sum + count, 0)

    // Calculate streaks using the data source
    const sortedDates = Object.entries(dataSource)
      .filter(([, count]) => count > 0) // Only consider dates with submissions
      .sort(([a], [b]) => a.localeCompare(b))

    let maxStreak = 0
    const currentStreak = 0
    let yearStreak = 0
    let monthStreak = 0

    const allDatesInRange = Object.keys(dataSource).sort()
    let tempStreak = 0
    let tempYearStreak = 0
    let tempMonthStreak = 0

    for (let i = 0; i < allDatesInRange.length; i++) {
      const date = allDatesInRange[i]
      const count = dataSource[date] || 0
      const dateObj = new Date(date)

      if (count > 0) {
        tempStreak++
        maxStreak = Math.max(maxStreak, tempStreak)

        if (dateObj >= oneYearAgo) {
          tempYearStreak++
          yearStreak = Math.max(yearStreak, tempYearStreak)
        } else {
          tempYearStreak = 0
        }

        if (dateObj >= oneMonthAgo) {
          tempMonthStreak++
          monthStreak = Math.max(monthStreak, tempMonthStreak)
        } else {
          tempMonthStreak = 0
        }
      } else {
        tempStreak = 0
        if (dateObj < oneYearAgo) tempYearStreak = 0
        if (dateObj < oneMonthAgo) tempMonthStreak = 0
      }
    }

    return {
      allTimeTotal,
      lastYearTotal,
      lastMonthTotal,
      maxStreak,
      yearStreak,
      monthStreak,
    }
  }

  const stats = calculateStatistics()

  console.log("[v0] Heatmap statistics:", {
    stats,
    displayDataEntries: Object.keys(displayData).length,
    maxSubmissions,
    selectedYear,
    dataSource: selectedYear === null ? "heatmapData" : "displayData",
  })

  console.log("[v0] Heatmap color debug:", {
    maxSubmissions,
    displayDataSample: Object.entries(displayData).slice(0, 5), // Show displayData instead
    sampleIntensities: monthlyData.slice(0, 1).flatMap((monthInfo) =>
      monthInfo.dates.map((date) => ({
        date,
        count: displayData[date] || 0,
        intensity: getIntensity(displayData[date] || 0),
        color: getColor(getIntensity(displayData[date] || 0)),
      })),
    ),
    dataOverlap: monthlyData.flatMap((monthInfo) => monthInfo.dates).filter((date) => displayData[date] > 0).length,
  })

  if (loading || isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-gray-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const availableYears = []
  for (let year = startYear; year <= currentYear; year++) {
    availableYears.push(year)
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with dropdowns */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value="All">
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue placeholder="What activity will be shown to other users:" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select
              value={selectedYear?.toString() || "rolling"}
              onValueChange={(value) => setSelectedYear(value === "rolling" ? null : Number.parseInt(value))}
            >
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Choose year" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="rolling">Last 12 months</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Heatmap */}
          <div className="space-y-6">
            {/* Month sections grid */}
            <div className="grid grid-cols-4 gap-6">
              {monthlyData.map((monthInfo, monthIndex) => (
                <div key={`${monthInfo.name}-${monthInfo.year}`} className="space-y-2">
                  {/* Month label */}
                  <div className="text-sm font-medium text-gray-300 text-center">
                    {monthInfo.name} {selectedYear !== null && monthInfo.year}
                  </div>

                  {/* Month grid */}
                  <div className="space-y-1">
                    {/* Day labels for first month only */}
                    {monthIndex === 0 && (
                      <div className="flex gap-1 text-xs text-gray-500 mb-1">
                        <div className="w-4 text-center">S</div>
                        <div className="w-4 text-center">M</div>
                        <div className="w-4 text-center">T</div>
                        <div className="w-4 text-center">W</div>
                        <div className="w-4 text-center">T</div>
                        <div className="w-4 text-center">F</div>
                        <div className="w-4 text-center">S</div>
                      </div>
                    )}

                    {/* Calendar grid for the month */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: new Date(monthInfo.year, monthInfo.month, 1).getDay() }).map((_, index) => (
                        <div key={`empty-${index}`} className="w-4 h-4" />
                      ))}

                      {/* Days of the month */}
                      {monthInfo.dates.map((date) => {
                        const count = displayData[date] || 0
                        const intensity = getIntensity(count)

                        return (
                          <div
                            key={date}
                            className={`w-4 h-4 rounded-sm ${getColor(intensity)} cursor-pointer transition-all hover:ring-1 hover:ring-white/50`}
                            title={`${date}: ${count} submissions`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((intensity) => (
                  <div key={intensity} className={`w-3 h-3 rounded-sm ${getColor(intensity)}`} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-8 pt-4">
            <div>
              <div className="text-2xl font-bold text-white">{stats.allTimeTotal} problems</div>
              <div className="text-sm text-gray-400">solved for all time</div>
              <div className="text-2xl font-bold text-white mt-2">{stats.maxStreak} days</div>
              <div className="text-sm text-gray-400">in a row max.</div>
            </div>

            <div>
              <div className="text-2xl font-bold text-white">{stats.lastYearTotal} problems</div>
              <div className="text-sm text-gray-400">solved for the last year</div>
              <div className="text-2xl font-bold text-white mt-2">{stats.yearStreak} days</div>
              <div className="text-sm text-gray-400">in a row for the last year</div>
            </div>

            <div>
              <div className="text-2xl font-bold text-white">{stats.lastMonthTotal} problems</div>
              <div className="text-sm text-gray-400">solved for the last month</div>
              <div className="text-2xl font-bold text-white mt-2">{stats.monthStreak} days</div>
              <div className="text-sm text-gray-400">in a row for the last month</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

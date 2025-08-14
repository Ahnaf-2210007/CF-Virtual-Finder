"use client"

import { useState, useMemo } from "react"
import { useContests } from "@/hooks/use-contests"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Trophy, RefreshCw, X } from "lucide-react"
import ContestCard from "@/components/contest-card"
import { Skeleton } from "@/components/ui/skeleton"

interface ContestBrowserProps {
  userHandle?: string
}

// Common Codeforces problem topics
const PROBLEM_TOPICS = [
  "implementation",
  "greedy",
  "dp",
  "math",
  "constructive algorithms",
  "graphs",
  "dfs and similar",
  "trees",
  "number theory",
  "combinatorics",
  "binary search",
  "two pointers",
  "sortings",
  "brute force",
  "strings",
  "data structures",
  "geometry",
  "bitmasks",
  "flows",
  "shortest paths",
  "graph matchings",
  "divide and conquer",
  "hashing",
  "probabilities",
  "games",
  "interactive",
  "matrices",
  "ternary search",
  "meet-in-the-middle",
]

export default function ContestBrowser({ userHandle }: ContestBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterType, setFilterType] = useState<"all" | "CF" | "IOI" | "ICPC">("all")
  const [filterDivision, setFilterDivision] = useState<"all" | "1" | "2" | "3" | "4" | "educational">("all")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [showOnlyUnsolved, setShowOnlyUnsolved] = useState(false)

  const { contests, loading, error, refetch } = useContests({
    handle: userHandle,
    filterSolved: showOnlyUnsolved,
  })

  const getContestDivision = (contestName: string): string => {
    const name = contestName.toLowerCase()
    if (name.includes("div. 1") || name.includes("division 1")) return "1"
    if (name.includes("div. 2") || name.includes("division 2")) return "2"
    if (name.includes("div. 3") || name.includes("division 3")) return "3"
    if (name.includes("div. 4") || name.includes("division 4")) return "4"
    if (name.includes("educational")) return "educational"
    return "unknown"
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]))
  }

  const clearAllTopics = () => {
    setSelectedTopics([])
  }

  // Filter and sort contests
  const filteredAndSortedContests = useMemo(() => {
    const filtered = contests.filter((contest) => {
      // Search filter
      if (searchQuery && !contest.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Type filter
      if (filterType !== "all" && contest.type !== filterType) {
        return false
      }

      if (filterDivision !== "all") {
        const division = getContestDivision(contest.name)
        if (division !== filterDivision) {
          return false
        }
      }

      // Only show finished contests for practice
      return contest.phase === "FINISHED"
    })

    // Sort contests
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = (a.startTimeSeconds || 0) - (b.startTimeSeconds || 0)
          break
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [contests, searchQuery, sortBy, sortOrder, filterType, filterDivision])

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">Error loading contests: {error}</div>
        <Button
          onClick={refetch}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Sort By</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Order</label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contest Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Type</label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CF">Codeforces</SelectItem>
                  <SelectItem value="IOI">IOI</SelectItem>
                  <SelectItem value="ICPC">ICPC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Division</label>
              <Select value={filterDivision} onValueChange={(value: any) => setFilterDivision(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Divisions</SelectItem>
                  <SelectItem value="1">Div. 1</SelectItem>
                  <SelectItem value="2">Div. 2</SelectItem>
                  <SelectItem value="3">Div. 3</SelectItem>
                  <SelectItem value="4">Div. 4</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Problem Topics</label>
              {selectedTopics.length > 0 && (
                <Button
                  onClick={clearAllTopics}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white h-auto p-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Selected Topics */}
            {selectedTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Available Topics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {PROBLEM_TOPICS.map((topic) => (
                <div
                  key={topic}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                    selectedTopics.includes(topic)
                      ? "bg-blue-600/20 border border-blue-600"
                      : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  }`}
                  onClick={() => toggleTopic(topic)}
                >
                  <Checkbox
                    checked={selectedTopics.includes(topic)}
                    onChange={() => {}} // Handled by parent onClick
                    className="border-gray-600"
                  />
                  <span className="text-xs text-gray-300 capitalize">{topic}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              Select topics to find contests with problems covering those areas. Leave unselected to include any topics.
            </p>
          </div>

          {/* Additional Options */}
          {userHandle && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unsolved-only"
                checked={showOnlyUnsolved}
                onCheckedChange={setShowOnlyUnsolved}
                className="border-gray-600"
              />
              <label htmlFor="unsolved-only" className="text-sm text-gray-300">
                Show only unsolved contests
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-gray-400">
          {loading ? (
            <Skeleton className="h-4 w-32 bg-gray-800" />
          ) : (
            `Found ${filteredAndSortedContests.length} contests`
          )}
        </div>
        <Button
          onClick={refetch}
          variant="outline"
          size="sm"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Contest Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-gray-800" />
                <Skeleton className="h-4 w-1/2 bg-gray-800" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-gray-800" />
                  <Skeleton className="h-4 w-2/3 bg-gray-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedContests.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No contests found</h3>
          <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  )
}

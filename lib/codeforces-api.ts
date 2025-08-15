// Codeforces API integration with rate limiting and error handling

export interface Contest {
  id: number
  name: string
  type: "CF" | "IOI" | "ICPC"
  phase: "BEFORE" | "CODING" | "PENDING_SYSTEM_TEST" | "SYSTEM_TEST" | "FINISHED"
  frozen: boolean
  durationSeconds: number
  startTimeSeconds?: number
  relativeTimeSeconds?: number
  preparedBy?: string
  websiteUrl?: string
  description?: string
  difficulty?: number
  kind?: string
  icpcRegion?: string
  country?: string
  city?: string
  season?: string
}

export interface Submission {
  id: number
  contestId?: number
  creationTimeSeconds: number
  relativeTimeSeconds: number
  problem: {
    contestId?: number
    problemsetName?: string
    index: string
    name: string
    type: "PROGRAMMING" | "QUESTION"
    points?: number
    rating?: number
    tags: string[]
  }
  author: {
    contestId?: number
    members: Array<{
      handle: string
      name?: string
    }>
    participantType: "CONTESTANT" | "PRACTICE" | "VIRTUAL" | "MANAGER" | "OUT_OF_COMPETITION"
    ghost: boolean
    room?: number
    startTimeSeconds?: number
  }
  programmingLanguage?: string
  verdict?:
    | "FAILED"
    | "OK"
    | "PARTIAL"
    | "COMPILATION_ERROR"
    | "RUNTIME_ERROR"
    | "WRONG_ANSWER"
    | "PRESENTATION_ERROR"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "IDLENESS_LIMIT_EXCEEDED"
    | "SECURITY_VIOLATED"
    | "CRASHED"
    | "INPUT_PREPARATION_CRASHED"
    | "CHALLENGED"
    | "SKIPPED"
    | "TESTING"
    | "REJECTED"
  testset:
    | "SAMPLES"
    | "PRETESTS"
    | "TESTS"
    | "CHALLENGES"
    | "TESTS1"
    | "TESTS2"
    | "TESTS3"
    | "TESTS4"
    | "TESTS5"
    | "TESTS6"
    | "TESTS7"
    | "TESTS8"
    | "TESTS9"
    | "TESTS10"
  passedTestCount?: number
  timeConsumedMillis?: number
  memoryConsumedBytes?: number
  points?: number
}

export interface User {
  handle: string
  email?: string
  vkId?: string
  openId?: string
  firstName?: string
  lastName?: string
  country?: string
  city?: string
  organization?: string
  contribution: number
  rank: string
  rating?: number
  maxRank: string
  maxRating?: number
  lastOnlineTimeSeconds: number
  registrationTimeSeconds: number
  friendOfCount: number
  avatar: string
  titlePhoto: string
}

// Rate limiting: Codeforces API allows 1 request per 2 seconds
class RateLimiter {
  private lastRequestTime = 0
  private readonly minInterval = 2000 // 2 seconds

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }
}

const rateLimiter = new RateLimiter()

async function codeforcesApiCall<T>(endpoint: string, retries = 3): Promise<T> {
  await rateLimiter.waitIfNeeded()

  const url = `https://codeforces.com/api/${endpoint}`

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CF-Virtual-Finder/1.0",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== "OK") {
        throw new Error(`Codeforces API error: ${data.comment || "Unknown error"}`)
      }

      return data.result
    } catch (error) {
      console.error(`Codeforces API call failed for ${endpoint} (attempt ${attempt}/${retries}):`, error)

      if (attempt === retries) {
        throw error
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw new Error("All retry attempts failed")
}

// Get all contests
export async function getContests(): Promise<Contest[]> {
  return codeforcesApiCall<Contest[]>("contest.list")
}

// Get user submissions
export async function getUserSubmissions(handle: string, from?: number, count?: number): Promise<Submission[]> {
  let endpoint = `user.status?handle=${encodeURIComponent(handle)}`

  if (from !== undefined) {
    endpoint += `&from=${from}`
  }

  if (count !== undefined) {
    endpoint += `&count=${count}`
  }

  return codeforcesApiCall<Submission[]>(endpoint)
}

// Get user info
export async function getUserInfo(handles: string[]): Promise<User[]> {
  const handlesParam = handles.map((h) => encodeURIComponent(h)).join(";")
  return codeforcesApiCall<User[]>(`user.info?handles=${handlesParam}`)
}

// Get contest standings (for checking if user participated)
export async function getContestStandings(contestId: number, handles?: string[]): Promise<any> {
  let endpoint = `contest.standings?contestId=${contestId}`

  if (handles && handles.length > 0) {
    const handlesParam = handles.map((h) => encodeURIComponent(h)).join(";")
    endpoint += `&handles=${handlesParam}`
  }

  return codeforcesApiCall<any>(endpoint)
}

// Utility function to get solved contests for a user
export async function getUserSolvedContests(handle: string): Promise<Set<number>> {
  try {
    const submissions = await getUserSubmissions(handle)
    const solvedContests = new Set<number>()

    // Group submissions by contest and problem
    const contestProblems = new Map<number, Set<string>>()

    submissions.forEach((submission) => {
      if (submission.verdict === "OK" && submission.contestId) {
        if (!contestProblems.has(submission.contestId)) {
          contestProblems.set(submission.contestId, new Set())
        }
        contestProblems.get(submission.contestId)!.add(submission.problem.index)
      }
    })

    // A contest is considered "solved" if user solved at least one problem
    // You can adjust this logic based on your requirements
    contestProblems.forEach((problems, contestId) => {
      if (problems.size > 0) {
        solvedContests.add(contestId)
      }
    })

    return solvedContests
  } catch (error) {
    console.error(`Failed to get solved contests for ${handle}:`, error)
    return new Set()
  }
}

// Utility function to filter contests based on user's solved contests
export function filterUnsolvedContests(contests: Contest[], solvedContests: Set<number>): Contest[] {
  return contests.filter((contest) => contest.phase === "FINISHED" && !solvedContests.has(contest.id))
}

// Utility function to get contest difficulty (estimated based on contest type and participants)
export function getContestDifficulty(contest: Contest): "Easy" | "Medium" | "Hard" | "Unknown" {
  // This is a simplified heuristic - you can improve this based on more data
  if (contest.type === "CF") {
    if (contest.name.includes("Div. 3") || contest.name.includes("Educational")) {
      return "Easy"
    } else if (contest.name.includes("Div. 2")) {
      return "Medium"
    } else if (contest.name.includes("Div. 1")) {
      return "Hard"
    }
  }

  return "Unknown"
}

export async function getUserRatingHistory(handle: string): Promise<any[]> {
  return codeforcesApiCall<any[]>(`user.rating?handle=${encodeURIComponent(handle)}`)
}

export async function getSubmissionHeatmapData(handle: string, year?: number): Promise<{ [date: string]: number }> {
  try {
    console.log("[v0] Fetching heatmap data for:", handle, year ? `year ${year}` : "rolling 12 months")
    const submissions = await getUserSubmissions(handle)
    const heatmapData: { [date: string]: number } = {}

    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (year) {
      // Specific year
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31)
    } else {
      // Rolling 12 months from current date
      endDate = new Date(now)
      startDate = new Date(now)
      startDate.setFullYear(startDate.getFullYear() - 1)
    }

    submissions.forEach((submission) => {
      if (submission.verdict === "OK") {
        const submissionDate = new Date(submission.creationTimeSeconds * 1000)

        // Only include submissions within the date range
        if (submissionDate >= startDate && submissionDate <= endDate) {
          const dateStr = submissionDate.toISOString().split("T")[0]
          heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1
        }
      }
    })

    console.log("[v0] Heatmap data points:", Object.keys(heatmapData).length)
    return heatmapData
  } catch (error) {
    console.error(`Failed to get heatmap data for ${handle}:`, error)
    return {}
  }
}

// Utility function to get contest stats for a user
export async function getUserContestStats(handle: string): Promise<{
  totalContests: number
  bestRank: number
  averageRank: number
  ratingChange: number
  maxRating: number
  currentRating: number
}> {
  try {
    const [userInfo, ratingHistory] = await Promise.all([getUserInfo([handle]), getUserRatingHistory(handle)])

    const user = userInfo[0]
    const totalContests = ratingHistory.length
    const ranks = ratingHistory.map((r) => r.rank)
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : 0
    const averageRank = ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0
    const ratingChange =
      ratingHistory.length > 1 ? ratingHistory[ratingHistory.length - 1].newRating - ratingHistory[0].oldRating : 0

    return {
      totalContests,
      bestRank,
      averageRank,
      ratingChange,
      maxRating: user.maxRating || 0,
      currentRating: user.rating || 0,
    }
  } catch (error) {
    console.error(`Failed to get contest stats for ${handle}:`, error)
    return {
      totalContests: 0,
      bestRank: 0,
      averageRank: 0,
      ratingChange: 0,
      maxRating: 0,
      currentRating: 0,
    }
  }
}

// Utility function to get rating color
export function getRatingColor(rating: number): string {
  if (rating === 0) return "text-gray-400" // unrated
  if (rating < 1200) return "text-gray-400" // newbie
  if (rating < 1400) return "text-green-400" // pupil
  if (rating < 1600) return "text-cyan-400" // specialist
  if (rating < 1900) return "text-blue-400" // expert
  if (rating < 2100) return "text-purple-400" // candidate master
  if (rating < 2300) return "text-orange-400" // master
  if (rating < 2400) return "text-orange-300" // international master
  if (rating < 2600) return "text-red-400" // grandmaster
  if (rating < 3000) return "text-red-300" // international grandmaster
  return "text-red-200" // legendary grandmaster
}

// Utility function to get rank from rating
export function getRankFromRating(rating: number): string {
  if (rating === 0) return "unrated"
  if (rating < 1200) return "newbie"
  if (rating < 1400) return "pupil"
  if (rating < 1600) return "specialist"
  if (rating < 1900) return "expert"
  if (rating < 2100) return "candidate master"
  if (rating < 2300) return "master"
  if (rating < 2400) return "international master"
  if (rating < 2600) return "grandmaster"
  if (rating < 3000) return "international grandmaster"
  return "legendary grandmaster"
}

export async function getProblemStatistics(handle: string): Promise<{
  totalSolved: number
  ratingDistribution: { [rating: string]: number }
  topicDistribution: { [topic: string]: number }
}> {
  try {
    console.log("[v0] Fetching problem statistics for:", handle)
    const submissions = await getUserSubmissions(handle)
    const solvedProblems = new Set<string>()
    const ratingDistribution: { [rating: string]: number } = {}
    const topicDistribution: { [topic: string]: number } = {}

    submissions.forEach((submission) => {
      if (submission.verdict === "OK") {
        const problemKey = `${submission.problem.contestId || "problemset"}-${submission.problem.index}`

        if (!solvedProblems.has(problemKey)) {
          solvedProblems.add(problemKey)

          // Rating distribution - use individual rating values
          const rating = submission.problem.rating
          if (rating) {
            const ratingKey = rating.toString()
            ratingDistribution[ratingKey] = (ratingDistribution[ratingKey] || 0) + 1
          }

          // Topic distribution
          submission.problem.tags.forEach((tag) => {
            topicDistribution[tag] = (topicDistribution[tag] || 0) + 1
          })
        }
      }
    })

    console.log("[v0] Problem statistics result:", {
      totalSolved: solvedProblems.size,
      ratingDistribution,
      topicDistribution, // Now shows the actual object with topic counts
    })

    return {
      totalSolved: solvedProblems.size,
      ratingDistribution,
      topicDistribution,
    }
  } catch (error) {
    console.error(`Failed to get problem statistics for ${handle}:`, error)
    return {
      totalSolved: 0,
      ratingDistribution: {},
      topicDistribution: {},
    }
  }
}

// Utility function to get virtual contest submissions
export async function getVirtualContestSubmissions(handle: string): Promise<
  {
    contestId: number
    contestName: string
    problemsSolved: number
    totalProblems: number
    participationTime: number
  }[]
> {
  try {
    const submissions = await getUserSubmissions(handle)
    const virtualContests = new Map<
      number,
      {
        contestName: string
        problems: Set<string>
        participationTime: number
      }
    >()

    submissions.forEach((submission) => {
      if (submission.author.participantType === "VIRTUAL" && submission.contestId) {
        if (!virtualContests.has(submission.contestId)) {
          virtualContests.set(submission.contestId, {
            contestName: `Contest ${submission.contestId}`,
            problems: new Set(),
            participationTime: submission.author.startTimeSeconds || 0,
          })
        }

        const contest = virtualContests.get(submission.contestId)!
        if (submission.verdict === "OK") {
          contest.problems.add(submission.problem.index)
        }
      }
    })

    return Array.from(virtualContests.entries()).map(([contestId, data]) => ({
      contestId,
      contestName: data.contestName,
      problemsSolved: data.problems.size,
      totalProblems: 6, // Typical contest has 6 problems, could be improved with actual contest data
      participationTime: data.participationTime,
    }))
  } catch (error) {
    console.error(`Failed to get virtual contest data for ${handle}:`, error)
    return []
  }
}

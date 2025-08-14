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

// Base API function with error handling
async function codeforcesApiCall<T>(endpoint: string): Promise<T> {
  await rateLimiter.waitIfNeeded()

  const url = `https://codeforces.com/api/${endpoint}`

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
    console.error(`Codeforces API call failed for ${endpoint}:`, error)
    throw error
  }
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

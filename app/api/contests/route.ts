import { type NextRequest, NextResponse } from "next/server"
import { getContests, getUserSolvedContests, filterUnsolvedContests } from "@/lib/codeforces-api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const handle = searchParams.get("handle")
    const filterSolved = searchParams.get("filterSolved") === "true"

    // Get all contests
    const contests = await getContests()

    // If handle is provided and filterSolved is true, filter out solved contests
    if (handle && filterSolved) {
      const solvedContests = await getUserSolvedContests(handle)
      const filteredContests = filterUnsolvedContests(contests, solvedContests)

      return NextResponse.json({
        success: true,
        data: filteredContests,
        total: filteredContests.length,
        filtered: true,
        handle,
      })
    }

    // Return all contests
    return NextResponse.json({
      success: true,
      data: contests,
      total: contests.length,
      filtered: false,
    })
  } catch (error) {
    console.error("Error fetching contests:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch contests",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

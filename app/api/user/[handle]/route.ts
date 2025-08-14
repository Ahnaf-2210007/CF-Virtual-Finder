import { type NextRequest, NextResponse } from "next/server"
import { getUserInfo, getUserSolvedContests } from "@/lib/codeforces-api"

export async function GET(request: NextRequest, { params }: { params: { handle: string } }) {
  try {
    const handle = params.handle

    if (!handle) {
      return NextResponse.json({ success: false, error: "Handle is required" }, { status: 400 })
    }

    // Get user info and solved contests in parallel
    const [userInfo, solvedContests] = await Promise.all([
      getUserInfo([handle]).then((users) => users[0]),
      getUserSolvedContests(handle),
    ])

    return NextResponse.json({
      success: true,
      data: {
        user: userInfo,
        solvedContestsCount: solvedContests.size,
        solvedContests: Array.from(solvedContests),
      },
    })
  } catch (error) {
    console.error(`Error fetching user data for ${params.handle}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

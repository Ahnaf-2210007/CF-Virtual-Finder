"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trophy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getVirtualContestSubmissions } from "@/lib/codeforces-api"

interface VirtualContestTrackerProps {
  userId: string
  userHandle?: string
}

interface VirtualContest {
  id: string
  contest_id: number
  contest_name: string
  problems_solved: number
  total_problems: number
  attempted_at: string
  status: "completed" | "attempted" | "planned"
}

export default function VirtualContestTracker({ userId, userHandle }: VirtualContestTrackerProps) {
  const [virtualContests, setVirtualContests] = useState<VirtualContest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingContest, setIsAddingContest] = useState(false)
  const [newContest, setNewContest] = useState({
    contestId: "",
    contestName: "",
    problemsSolved: "",
    totalProblems: "6",
  })

  useEffect(() => {
    fetchVirtualContests()
    if (userHandle) {
      fetchCFVirtualContests()
    }
  }, [userId, userHandle])

  const fetchVirtualContests = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("user_contest_tracking")
        .select("*")
        .eq("user_id", userId)
        .eq("is_virtual", true)
        .order("attempted_at", { ascending: false })

      if (data) {
        setVirtualContests(data)
      }
    } catch (error) {
      console.error("Error fetching virtual contests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCFVirtualContests = async () => {
    if (!userHandle) return

    try {
      const cfVirtualContests = await getVirtualContestSubmissions(userHandle)

      // Add CF virtual contests to database if not already tracked
      const supabase = createClient()

      for (const contest of cfVirtualContests) {
        const { data: existing } = await supabase
          .from("user_contest_tracking")
          .select("id")
          .eq("user_id", userId)
          .eq("contest_id", contest.contestId)
          .eq("is_virtual", true)
          .single()

        if (!existing) {
          await supabase.from("user_contest_tracking").insert({
            user_id: userId,
            contest_id: contest.contestId,
            contest_name: contest.contestName,
            problems_solved: contest.problemsSolved,
            total_problems: contest.totalProblems,
            status: contest.problemsSolved === contest.totalProblems ? "completed" : "attempted",
            attempted_at: new Date(contest.participationTime * 1000).toISOString(),
            is_virtual: true,
          })
        }
      }

      // Refresh the list
      fetchVirtualContests()
    } catch (error) {
      console.error("Error fetching CF virtual contests:", error)
    }
  }

  const addVirtualContest = async () => {
    if (!newContest.contestId || !newContest.contestName) return

    try {
      const supabase = createClient()
      const problemsSolved = Number.parseInt(newContest.problemsSolved) || 0
      const totalProblems = Number.parseInt(newContest.totalProblems) || 6

      await supabase.from("user_contest_tracking").insert({
        user_id: userId,
        contest_id: Number.parseInt(newContest.contestId),
        contest_name: newContest.contestName,
        problems_solved: problemsSolved,
        total_problems: totalProblems,
        status: problemsSolved === totalProblems ? "completed" : problemsSolved > 0 ? "attempted" : "planned",
        attempted_at: new Date().toISOString(),
        is_virtual: true,
      })

      setNewContest({
        contestId: "",
        contestName: "",
        problemsSolved: "",
        totalProblems: "6",
      })
      setIsAddingContest(false)
      fetchVirtualContests()
    } catch (error) {
      console.error("Error adding virtual contest:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "attempted":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "planned":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Virtual Contests
            </CardTitle>
            <CardDescription className="text-gray-400">
              Track your virtual contest attempts and progress
            </CardDescription>
          </div>
          <Dialog open={isAddingContest} onOpenChange={setIsAddingContest}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Contest
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Add Virtual Contest</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Manually add a virtual contest attempt to track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contestId" className="text-gray-300">
                    Contest ID
                  </Label>
                  <Input
                    id="contestId"
                    value={newContest.contestId}
                    onChange={(e) => setNewContest({ ...newContest, contestId: e.target.value })}
                    placeholder="e.g., 1234"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="contestName" className="text-gray-300">
                    Contest Name
                  </Label>
                  <Input
                    id="contestName"
                    value={newContest.contestName}
                    onChange={(e) => setNewContest({ ...newContest, contestName: e.target.value })}
                    placeholder="e.g., Codeforces Round #800"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="problemsSolved" className="text-gray-300">
                      Problems Solved
                    </Label>
                    <Input
                      id="problemsSolved"
                      type="number"
                      value={newContest.problemsSolved}
                      onChange={(e) => setNewContest({ ...newContest, problemsSolved: e.target.value })}
                      placeholder="0"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalProblems" className="text-gray-300">
                      Total Problems
                    </Label>
                    <Input
                      id="totalProblems"
                      type="number"
                      value={newContest.totalProblems}
                      onChange={(e) => setNewContest({ ...newContest, totalProblems: e.target.value })}
                      placeholder="6"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <Button onClick={addVirtualContest} className="w-full bg-blue-600 hover:bg-blue-700">
                  Add Contest
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {virtualContests.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500">No virtual contests tracked yet</p>
            <p className="text-gray-600 text-sm">Add contests manually or they'll be auto-detected from CF</p>
          </div>
        ) : (
          <div className="space-y-3">
            {virtualContests.map((contest) => (
              <div key={contest.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium">{contest.contest_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getStatusColor(contest.status)} border text-xs`}>{contest.status}</Badge>
                    <span className="text-xs text-gray-400">
                      {contest.problems_solved}/{contest.total_problems} problems
                    </span>
                    <span className="text-xs text-gray-500">{new Date(contest.attempted_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">#{contest.contest_id}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

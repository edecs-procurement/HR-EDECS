"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type: string
  description: string
  timestamp: Date
  user: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(5))

        const snapshot = await getDocs(q)
        const activitiesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            type: data.type,
            description: data.description,
            timestamp: data.timestamp?.toDate() || new Date(),
            user: data.user,
          }
        })

        setActivities(activitiesData)
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "employee":
        return "👤"
      case "attendance":
        return "⏰"
      case "payroll":
        return "💰"
      case "leave":
        return "📅"
      default:
        return "📝"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4 text-muted-foreground">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No recent activities</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="text-xl">{getActivityIcon(activity.type)}</div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

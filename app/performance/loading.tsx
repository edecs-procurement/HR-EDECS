import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PerformanceLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-5 w-[150px]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card className="w-full md:w-2/3">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-5 w-[180px]" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-[220px]" />
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="p-4 rounded-lg">
                  <Skeleton className="h-8 w-[60px] mx-auto mb-2" />
                  <Skeleton className="h-4 w-[80px] mx-auto" />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              <Skeleton className="h-5 w-[220px]" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-[280px]" />
            </CardDescription>
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <Skeleton className="h-10 w-full mb-4" />
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full mb-4" />
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

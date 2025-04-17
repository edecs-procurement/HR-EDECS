export default function AttendanceLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3 h-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-full md:w-2/3 h-48 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
    </div>
  )
}

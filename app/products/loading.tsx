export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-black via-red-900 to-red-700 text-white py-16">
        <div className="site-container">
          <div className="h-8 w-48 bg-white/20 rounded mb-4 animate-pulse" />
          <div className="h-4 w-80 bg-white/20 rounded animate-pulse" />
        </div>
      </div>

      <div className="site-container py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-6" />
              <div className="h-9 bg-gray-200 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-black/5 shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="h-56 sm:h-64 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

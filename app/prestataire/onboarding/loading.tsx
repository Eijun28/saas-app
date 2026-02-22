export default function PrestataireOnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center animate-pulse">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-48 bg-gray-100 rounded-xl mx-auto" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg mx-auto" />
        </div>
        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-2 w-16 bg-gray-100 rounded-full" />
          ))}
        </div>
        {/* Form skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-4">
          <div className="h-6 w-40 bg-gray-100 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-50 rounded-xl" />
            </div>
          ))}
          <div className="h-10 bg-purple-100 rounded-xl mt-4" />
        </div>
      </div>
    </div>
  )
}

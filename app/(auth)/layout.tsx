export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8D4EF] to-white px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}


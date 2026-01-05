export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #f8f0fa 25%, #eecdf6 60%, #e8c4f0 100%)',
      }}
    >
      <div className="w-full max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}


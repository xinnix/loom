export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-600">Roundtable</h1>
          <p className="mt-1 text-sm text-neutral-500">用户端</p>
        </div>
        {children}
      </div>
    </div>
  );
}

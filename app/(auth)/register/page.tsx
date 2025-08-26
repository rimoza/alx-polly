import { Button } from "@/components/ui/button"
import { signup } from "@/app/auth/actions"
import Link from "next/link"

interface RegisterPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { error, message } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" action={signup}>
          <div className="space-y-4">            
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Create a password (minimum 6 characters)"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </div>
    </div>
  )
}
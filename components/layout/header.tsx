import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          ALX Polly
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/polls" className="text-sm font-medium hover:text-gray-600">
            Browse Polls
          </Link>
          <Link href="/polls/create" className="text-sm font-medium hover:text-gray-600">
            Create Poll
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-gray-600">
            Dashboard
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
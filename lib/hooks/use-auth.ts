"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(false)
      } catch (error) {
        console.error("Auth check failed:", error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    console.log("Login attempt:", email, password)
  }

  const logout = async () => {
    setUser(null)
  }

  const register = async (email: string, password: string, name: string) => {
    console.log("Register attempt:", email, password, name)
  }

  return {
    user,
    loading,
    login,
    logout,
    register,
  }
}
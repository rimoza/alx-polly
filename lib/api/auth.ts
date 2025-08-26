export async function loginUser(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error("Login failed")
  }

  return response.json()
}

export async function registerUser(email: string, password: string, name: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  })

  if (!response.ok) {
    throw new Error("Registration failed")
  }

  return response.json()
}

export async function logoutUser() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error("Logout failed")
  }

  return response.json()
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/me")

  if (!response.ok) {
    throw new Error("Failed to fetch user")
  }

  return response.json()
}
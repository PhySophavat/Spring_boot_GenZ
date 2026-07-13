import type { User } from "../types/user";

const USERS_API_PATH = "/api/users";

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(USERS_API_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load users (HTTP ${response.status})`);
  }
  return response.json() as Promise<User[]>;
}

export async function createUser(
  data: { fullName: string; phoneNumber: string; email?: string; password: string }
): Promise<User> {
  const response = await fetch(USERS_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(message || `HTTP ${response.status}`);
  }
  return response.json() as Promise<User>;
}

export async function updateUser(
  id: number,
  data: { fullName: string; phoneNumber: string; email?: string; password: string }
): Promise<User> {
  const response = await fetch(`${USERS_API_PATH}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(message || `HTTP ${response.status}`);
  }
  return response.json() as Promise<User>;
}

export async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`${USERS_API_PATH}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete user (HTTP ${response.status})`);
  }
}

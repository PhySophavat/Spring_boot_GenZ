export interface UserSession {
  token: string;
  user: {
    name: string;
    email: string;
    role: "admin" | "sub-admin";
  };
}

const AUTH_KEY = "flex_pay_auth_session";

export function getSession(): UserSession | null {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

export async function login(email: string, password: string): Promise<UserSession> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email && password.length >= 6) {
        resolve({
          token: "mock-jwt-token-12345",
          user: { name: "Flex Admin", email, role: "admin" }
        });
      } else {
        reject(new Error("Invalid email or password. Minimum 6 characters required."));
      }
    }, 1200);
  });
}

export async function signup(name: string, email: string, password: string, role: string): Promise<UserSession> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!name || !email || password.length < 6) {
        reject(new Error("Please fill in all fields with a valid password."));
      } else {
        resolve({
          token: "mock-jwt-token-67890",
          user: { name, email, role: role as "admin" | "sub-admin" }
        });
      }
    }, 1500);
  });
}

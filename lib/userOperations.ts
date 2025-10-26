import { User, Connection } from "./types";

export async function loadUserData(): Promise<{
  user: User | null;
  connections: Connection[];
}> {
  try {
    const userId = localStorage.getItem("userId");

    if (userId) {
      const response = await fetch(`/api/users?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          user: data.user,
          connections: data.connections || [],
        };
      }
    }

    return {
      user: null,
      connections: [],
    };
  } catch (error) {
    console.error("Error loading user data:", error);
    return {
      user: null,
      connections: [],
    };
  }
}

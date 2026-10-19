import { useContext } from "react"
import { AuthContext } from "../context"
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { qk } from "./query-keys";
import { SESSION_STALE_MS } from "@/constants";

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export interface Session {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
}

export function useSession() {
  return useQuery({
    queryKey: qk.session.me(),
    queryFn: () => apiClient.get<Session>("/auth/me"),
    staleTime: SESSION_STALE_MS,
    retry: 0,
  });
}
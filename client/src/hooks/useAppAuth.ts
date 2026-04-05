import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

/**
 * Custom auth hook for the app's email/password authentication system.
 * Returns the current user, loading state, and auth status.
 */
export function useAppAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000, // 30 seconds
  });

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const isPending = user?.status === "pending";
  const isSuspended = user?.status === "suspended";
  const isActive = user?.status === "active";

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isPending,
    isSuspended,
    isActive,
  };
}

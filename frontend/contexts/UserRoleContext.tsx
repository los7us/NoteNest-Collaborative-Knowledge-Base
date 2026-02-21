"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type UserRole, isValidRole } from "@/lib/permissions";

const STORAGE_KEY_ROLE = "notenest-user-role";
const STORAGE_KEY_AUTH = "notenest-is-authenticated";
const DEFAULT_ROLE: UserRole = "editor";

function readStoredRole(): UserRole {
  if (typeof window === "undefined") return DEFAULT_ROLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROLE);
    if (raw && isValidRole(raw)) return raw as UserRole;
  } catch {
    // ignore
  }
  return DEFAULT_ROLE;
}

function readStoredAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    return raw === "true";
  } catch {
    // ignore
  }
  return false;
}

interface UserRoleContextValue {
  role: UserRole;
  isAuthenticated: boolean;
  login: (role?: UserRole) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    setRoleState(readStoredRole());
    setIsAuthenticated(readStoredAuth());
  }, []);

  const login = useCallback((newRole: UserRole = "editor") => {
    setRoleState(newRole);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE, newRole);
      localStorage.setItem(STORAGE_KEY_AUTH, "true");
      // Actually, token is saved in login.tsx, but we can keep this clean.
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(() => {
    setRoleState(DEFAULT_ROLE);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY_ROLE);
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem('token');
    } catch {
      // ignore
    }
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem(STORAGE_KEY_ROLE, newRole);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<UserRoleContextValue>(() => ({ role, isAuthenticated, login, logout, setRole }), [role, isAuthenticated, login, logout, setRole]);

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole(): UserRoleContextValue {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    throw new Error("useUserRole must be used within UserRoleProvider");
  }
  return ctx;
}

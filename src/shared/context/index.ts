import type { AuthContextValue } from "@/features/identity/auth-context";
import { createContext } from "react";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

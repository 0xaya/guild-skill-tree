"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { CharacterProvider } from "./contexts/CharacterContext";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CharacterProvider>{children}</CharacterProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

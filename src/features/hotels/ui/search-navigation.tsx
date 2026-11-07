'use client';
import { createContext, useContext, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const SearchNavigationContext = createContext<{
  pending: boolean;
  push: (href: string) => void;
} | null>(null);
export function SearchNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <SearchNavigationContext.Provider
      value={{
        pending,
        push: (href) => startTransition(() => router.push(href, { scroll: false })),
      }}
    >
      {children}
    </SearchNavigationContext.Provider>
  );
}
export function useSearchNavigation() {
  const value = useContext(SearchNavigationContext);
  if (!value) throw new Error('Search controls require SearchNavigationProvider');
  return value;
}

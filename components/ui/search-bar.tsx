'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from './input';
import { useUserSearch } from '@/lib/api/hooks/useUserSearch';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { AnimatePresence, motion } from 'framer-motion';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom debounce hook natively
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: results = [], isLoading } = useUserSearch(debouncedQuery);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debouncedQuery.trim().length > 0) {
      router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
      setIsFocused(false);
    }
  };

  const handleSelectUser = (_userId: string) => {
    // Or navigate to their profile when that feature is ready!
    // For now we can just route to the full search page or a specific user path.
    // Assuming /profile/[id] isn't implemented yet, let's just go to the search view.
    router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
    setIsFocused(false);
  };

  const showDropdown = isFocused && debouncedQuery.length >= 2;

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <form onSubmit={handleSearchSubmit} className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          type="text"
          placeholder="Search users..."
          className="pl-9 pr-10 w-full bg-background/50 border-primary/20 focus-visible:ring-primary/30 transition-all rounded-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full bg-background/95 backdrop-blur-md border border-primary/20 rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50"
          >
            {results.length > 0 ? (
              <div className="py-2 flex flex-col max-h-[300px] overflow-y-auto">
                <span className="text-xs font-semibold text-muted-foreground px-3 mb-1 uppercase tracking-wider">Top Results</span>
                {results.map((user: import('@/lib/api/services/userService').UserSearchResponse) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-primary/10 transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarImage src={user.avatarUrl || ''} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate">{user.name} {user.lastName || ''}</span>
                    </div>
                  </button>
                ))}
                <div 
                  className="px-3 py-2 mt-1 border-t border-primary/10 text-xs text-center text-primary cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={(e) => { e.preventDefault(); handleSearchSubmit(e as unknown as React.FormEvent); }}
                >
                  View all results for &quot;{debouncedQuery}&quot;
                </div>
              </div>
            ) : (
              !isLoading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No users found for &quot;{debouncedQuery}&quot;
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

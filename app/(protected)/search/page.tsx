'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUserSearch } from '@/lib/api/hooks/useUserSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { data: results = [], isLoading } = useUserSearch(query, 50); // Get up to 50 results

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-primary/50" />
        </div>
        <h2 className="text-2xl font-bold heading-classical mb-2">Search Users</h2>
        <p className="text-muted-foreground max-w-md">
          Type a name, username, or email in the top search bar to find profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold heading-classical">Search Results</h1>
        <p className="text-muted-foreground mt-2">
          Showing results for <span className="text-foreground font-medium">&quot;{query}&quot;</span>
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-6 border rounded-2xl bg-card/40 border-primary/10 animate-pulse">
              <Skeleton className="h-20 w-20 rounded-full mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="group flex flex-col items-center p-6 bg-card border border-primary/10 hover:border-primary/30 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Avatar className="h-20 w-20 border-2 border-primary/20 mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <AvatarImage src={user.avatarUrl || ''} className="object-cover" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold text-center mb-1 group-hover:text-primary transition-colors">
                {user.name} {user.lastName || ''}
              </h3>
              {/* Could add a `@username` here if username logic is integrated, for now just relying on name */}
              <p className="text-xs text-muted-foreground/80 mt-2 font-medium tracking-wide">
                VIEW PROFILE
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center p-8 bg-card/30 border border-border/50 rounded-2xl border-dashed">
          <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground max-w-sm">
            We couldn&apos;t find any profiles matching &quot;{query}&quot;. Try trying a different spelling or name.
          </p>
        </div>
      )}
    </div>
  );
}

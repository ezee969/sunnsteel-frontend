'use client';

import React from 'react';
import { useUser } from '@/lib/api/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Dumbbell, 
  Flame, 
  MapPin, 
  CalendarDays,
  Activity,
  Trophy,
  Share2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl md:col-span-1" />
          <Skeleton className="h-[400px] w-full rounded-xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">User not found or not authenticated.</p>
      </div>
    );
  }

  // @ts-expect-error - createdAt is returned by the backend but missing from the frontend User type
  const joinDateText = formatDistanceToNow(new Date(user.createdAt || new Date()), { addSuffix: true });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner & Profile Header */}
      <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm relative shadow-sm">
         {/* Decorative Banner Background */}
         <div className="h-32 md:h-48 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-card/80 to-transparent backdrop-blur-[2px]"></div>
         </div>
         
         <div className="px-6 md:px-10 pb-8 relative">
           <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-16 md:-mt-20">
              {/* Avatar Container with Glow */}
              <div className="relative group self-center md:self-start">
                 <div className="absolute -inset-0.5 bg-gradient-to-br from-primary via-primary/50 to-transparent rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
                 <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card relative z-10 shadow-xl bg-card">
                    <AvatarImage src={user.avatarUrl || ''} alt={user.name} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary font-serif">
                       {user.name.charAt(0)}{user.lastName?.charAt(0)}
                    </AvatarFallback>
                 </Avatar>
              </div>

              {/* User Info Header */}
              <div className="flex-1 text-center md:text-left space-y-2 mt-4 md:mt-0">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-center md:justify-start">
                   <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground heading-classical">
                     {user.name} {user.lastName}
                   </h1>
                   <div className="flex gap-2 justify-center">
                     <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-30 border border-primary/20">
                        Pro Member
                     </Badge>
                   </div>
                 </div>
                 <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-1.5 text-sm md:text-base">
                   <CalendarDays className="h-4 w-4" /> Joined {joinDateText}
                 </p>
                 
                 {/* Stats Links (Followers/Following) */}
                 <div className="flex gap-4 justify-center md:justify-start pt-2">
                   <div className="cursor-pointer hover:opacity-80 transition-opacity flex items-baseline gap-1.5">
                      <span className="text-lg font-bold heading-classical">248</span>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Followers</span>
                   </div>
                   <div className="cursor-pointer hover:opacity-80 transition-opacity flex items-baseline gap-1.5">
                      <span className="text-lg font-bold heading-classical">184</span>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Following</span>
                   </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-end gap-3 mt-4 md:mt-0 w-full md:w-auto">
                 <Button variant="outline" size="sm" className="hidden sm:flex border-primary/20 hover:bg-primary/10 transition-colors">
                   <Share2 className="h-4 w-4 mr-2" /> Share Profile
                 </Button>
                 <Button variant="classical" size="sm">
                    Follow
                 </Button>
              </div>
           </div>
         </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Bio & Intro) */}
        <div className="space-y-6 lg:col-span-1 border-r-0 lg:border-r border-border/40 pr-0 lg:pr-6">
           <div className="space-y-4">
              <h2 className="text-xl font-semibold heading-classical flex items-center gap-2">
                 <User className="h-5 w-5 text-primary" /> About
              </h2>
              {/* Bio Placeholder */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                 Fitness enthusiast on a journey to become stronger every day. Currently running a Push/Pull/Legs split and focusing on progressive overload. 
                 <br/><br/>
                 &quot;The iron never lies to you.&quot;
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <MapPin className="h-4 w-4" /> San Francisco, CA
              </div>
           </div>

        </div>

        {/* Right Column (Fitness Stats & Activity) */}
        <div className="lg:col-span-2 space-y-6">
          
           {/* Primary Stats Grid */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Total Workouts */}
              <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 shadow-sm relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300">
                    <Dumbbell className="h-24 w-24 text-primary" />
                 </div>
                 <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workouts</span>
                       <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-3xl font-bold heading-classical">142</div>
                    <div className="text-xs text-emerald-500 mt-1 font-medium">+12 this month</div>
                 </CardContent>
              </Card>

              {/* Current Streak */}
              <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 shadow-sm relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300">
                    <Flame className="h-24 w-24 text-orange-500" />
                 </div>
                 <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Streak</span>
                       <Flame className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-3xl font-bold heading-classical">14 <span className="text-lg text-muted-foreground font-normal">days</span></div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Personal Best: 32</div>
                 </CardContent>
              </Card>

              {/* Volume Lifted Placeholder */}
              <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 shadow-sm relative overflow-hidden group sm:col-span-2">
                 <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-300">
                    <Activity className="h-24 w-24 text-blue-500" />
                 </div>
                 <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volume Lifted Total</span>
                       <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex items-end gap-2">
                       <div className="text-3xl font-bold heading-classical">1.2M</div>
                       <div className="text-sm text-muted-foreground mb-1 font-medium">{user.weightUnit === 'KG' ? 'kg' : 'lbs'}</div>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Recent Activity Placeholder (Just visual, no data yet) */}
           <Card className="border-border/40 bg-card/30 backdrop-blur-sm shadow-sm p-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/[0.01] to-transparent pointer-events-none"></div>
              <h3 className="text-lg font-semibold heading-classical mb-6 flex items-center gap-2">
                 <Trophy className="h-5 w-5 text-primary" /> Recent Achievements
              </h3>
              
              <div className="space-y-4">
                 {[
                   { title: 'Century Club', desc: 'Logged 100 workouts total', date: '2 days ago', icon: <Medal className="h-5 w-5 text-yellow-500" /> },
                   { title: 'Consistency King', desc: 'Workout out 4 times a week for a month', date: 'Last week', icon: <Flame className="h-5 w-5 text-orange-500" /> },
                   { title: 'Heavy Lifter', desc: 'Squat 1RM reached 315 lbs', date: '2 weeks ago', icon: <Target className="h-5 w-5 text-blue-500" /> }
                 ].map((achievement, i) => (
                   <div key={i} className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 group">
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform">
                         {achievement.icon}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-semibold text-sm">{achievement.title}</h4>
                         <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{achievement.date}</span>
                   </div>
                 ))}
              </div>
           </Card>

        </div>
      </div>
    </div>
  );
}

// Missing icons for the mock data above
function User(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function Medal(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg> }
function Target(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> }

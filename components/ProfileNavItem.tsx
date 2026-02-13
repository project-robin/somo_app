'use client';

import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserProfile, useOnboardingStatus } from '@/hooks/useUserProfile';

interface ProfileNavItemProps {
  variant?: 'sidebar' | 'header';
  onNavigate?: (path: string) => void;
}

export function ProfileNavItem({ variant = 'sidebar', onNavigate }: ProfileNavItemProps) {
  const { user } = useUser();
  const { profile, state } = useUserProfile();
  const { isComplete } = useOnboardingStatus();

  const isLoading = state === 'loading' || state === 'idle';

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate('/profile');
    } else {
      window.location.href = '/profile';
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined' && (window as any).Clerk) {
      (window as any).Clerk.signOut();
    }
  };

  if (variant === 'header') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface-primary)] transition-colors"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={profile?.name || user?.fullName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                </div>
              )}
            </div>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-[var(--bg-secondary)] border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={profile?.name || user?.fullName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {profile?.name || user?.fullName || 'User'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
          <DropdownMenuItem
            onClick={handleProfileClick}
            className="cursor-pointer text-[var(--text-primary)] focus:bg-[var(--surface-secondary)] text-sm"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-[var(--text-secondary)] focus:bg-[var(--surface-secondary)] text-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="border-t border-[var(--border-subtle)] pt-3 mt-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--surface-primary)] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={profile?.name || user?.fullName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">
                {profile?.name || user?.fullName || 'User'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">
                {isLoading ? 'Loading...' : isComplete ? 'Complete' : 'Setup'}
              </p>
            </div>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-48 bg-[var(--bg-secondary)] border-[var(--border-subtle)] mb-2">
          <DropdownMenuItem
            onClick={handleProfileClick}
            className="cursor-pointer text-[var(--text-primary)] focus:bg-[var(--surface-secondary)] text-sm"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-[var(--text-secondary)] focus:bg-[var(--surface-secondary)] text-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

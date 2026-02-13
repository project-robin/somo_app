'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { astroShivaClient, UserProfile } from '@/lib/api-client';
import {
  ExtendedUserProfile,
  ProfileLoadingState,
  ProfileError,
  ProfileErrorCode,
  parseAstroSummary,
} from '@/lib/user-profile';

interface UseUserProfileOptions {
  /** Enable automatic refetching on window focus */
  refetchOnFocus?: boolean;
  /** Polling interval in milliseconds (0 to disable) */
  pollingInterval?: number;
  /** Maximum number of retries on error */
  maxRetries?: number;
}

interface UseUserProfileReturn {
  /** The user profile data */
  profile: ExtendedUserProfile | null;
  /** Current loading state */
  state: ProfileLoadingState;
  /** Error information if any */
  error: ProfileError | null;
  /** Manually refresh the profile */
  refetch: () => Promise<void>;
  /** Whether a refetch is in progress */
  isRefetching: boolean;
  /** Last successful fetch timestamp */
  lastFetchedAt: Date | null;
}

/**
 * React hook for fetching and managing user profile data
 *
 * Features:
 * - Automatic authentication handling via Clerk
 * - Loading and error states
 * - Caching with stale-while-revalidate behavior
 * - Optional polling for real-time updates
 * - Profile data enrichment with parsed astro summary
 *
 * @example
 * ```tsx
 * const { profile, state, error, refetch } = useUserProfile();
 *
 * if (state === 'loading') return <LoadingSkeleton />;
 * if (error) return <ErrorMessage error={error} onRetry={refetch} />;
 * if (profile) return <ProfileCard profile={profile} />;
 * ```
 */
export function useUserProfile(options: UseUserProfileOptions = {}): UseUserProfileReturn {
  const {
    refetchOnFocus = false,
    pollingInterval = 0,
    maxRetries = 3,
  } = options;

  const { isLoaded, isSignedIn } = useAuth();

  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [state, setState] = useState<ProfileLoadingState>('idle');
  const [error, setError] = useState<ProfileError | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const retryCountRef = useRef(0);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProfile = useCallback(async (isBackgroundRefetch = false) => {
    if (!isSignedIn) {
      setProfile(null);
      setState('idle');
      return;
    }

    if (!isBackgroundRefetch) {
      setState('loading');
    } else {
      setIsRefetching(true);
    }

    setError(null);

    try {
      const result = await astroShivaClient.getProfile();

      if (result.success) {
        const userProfile = result.data;

        // Enrich profile with parsed astro data
        const parsedSummary = parseAstroSummary(userProfile.astroProfile?.astroSummary || '');

        const extendedProfile: ExtendedUserProfile = {
          ...userProfile,
          sunSign: parsedSummary.sunSign,
          moonSign: parsedSummary.moonSign,
          ascendant: parsedSummary.ascendant,
          nakshatra: parsedSummary.nakshatra,
        };

        setProfile(extendedProfile);
        setState('success');
        setLastFetchedAt(new Date());
        retryCountRef.current = 0;
      } else {
        // Handle API error response
        const errorCode = result.error.code as ProfileErrorCode;
        const profileError: ProfileError = {
          code: errorCode || 'UNKNOWN_ERROR',
          message: result.error.message,
          retryable: errorCode !== 'UNAUTHORIZED' && errorCode !== 'USER_NOT_FOUND',
        };

        setError(profileError);
        setState('error');

        // Retry logic for retryable errors
        if (profileError.retryable && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          setTimeout(() => fetchProfile(isBackgroundRefetch), delay);
        }
      }
    } catch (err) {
      const isNetworkError = err instanceof Error &&
        (err.message.includes('NetworkError') || err.message.includes('fetch'));

      const profileError: ProfileError = {
        code: isNetworkError ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        retryable: isNetworkError,
      };

      setError(profileError);
      setState('error');

      // Retry logic for network errors
      if (profileError.retryable && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        setTimeout(() => fetchProfile(isBackgroundRefetch), delay);
      }
    } finally {
      if (!isBackgroundRefetch) {
        setState((current) => current === 'loading' ? 'success' : current);
      }
      setIsRefetching(false);
    }
  }, [isSignedIn, maxRetries]);

  // Initial fetch
  useEffect(() => {
    if (!isLoaded) return;
    fetchProfile();
  }, [isLoaded, fetchProfile]);

  // Polling
  useEffect(() => {
    if (pollingInterval <= 0 || state !== 'success') return;

    const startPolling = () => {
      pollingTimeoutRef.current = setTimeout(() => {
        fetchProfile(true);
        startPolling();
      }, pollingInterval);
    };

    startPolling();

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [pollingInterval, state, fetchProfile]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      // Only refetch if data is stale (older than 5 minutes)
      if (lastFetchedAt && Date.now() - lastFetchedAt.getTime() > 5 * 60 * 1000) {
        fetchProfile(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, lastFetchedAt, fetchProfile]);

  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    state,
    error,
    refetch,
    isRefetching,
    lastFetchedAt,
  };
}

/**
 * Hook for checking if user has completed onboarding
 */
export function useOnboardingStatus(): {
  isComplete: boolean;
  isLoading: boolean;
  status: UserProfile['status'] | null;
} {
  const { profile, state } = useUserProfile();

  return {
    isComplete: profile?.status === 'completed',
    isLoading: state === 'loading' || state === 'idle',
    status: profile?.status || null,
  };
}

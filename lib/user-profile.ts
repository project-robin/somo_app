import { UserProfile } from './api-client';

/**
 * Extended user profile with additional fields for the UI
 */
export interface ExtendedUserProfile extends UserProfile {
  /** User's avatar URL from Clerk */
  avatarUrl?: string;
  /** Parsed birth details for display */
  birthDetails?: {
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  /** Planetary positions (if available from API) */
  planetaryPositions?: Record<string, string>;
  /** Zodiac sign based on birth date */
  sunSign?: string;
  /** Moon sign based on birth details */
  moonSign?: string;
  /** Ascendant/Rising sign */
  ascendant?: string;
  /** Nakshatra (lunar mansion) */
  nakshatra?: string;
}

/**
 * Profile loading state
 */
export type ProfileLoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Profile error types
 */
export type ProfileErrorCode =
  | 'UNAUTHORIZED'
  | 'USER_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Profile error structure
 */
export interface ProfileError {
  code: ProfileErrorCode;
  message: string;
  retryable: boolean;
}

/**
 * Parse astro summary to extract key information
 * This is a utility to extract structured data from the markdown summary
 */
export function parseAstroSummary(summary: string): {
  sunSign?: string;
  moonSign?: string;
  ascendant?: string;
  nakshatra?: string;
  keyTraits?: string[];
} {
  const result: {
    sunSign?: string;
    moonSign?: string;
    ascendant?: string;
    nakshatra?: string;
    keyTraits?: string[];
  } = {};

  // Extract Sun Sign
  const sunMatch = summary.match(/Sun[^.]*in\s+([A-Za-z]+)/i);
  if (sunMatch) {
    result.sunSign = sunMatch[1];
  }

  // Extract Moon Sign
  const moonMatch = summary.match(/Moon[^.]*in\s+([A-Za-z]+)/i);
  if (moonMatch) {
    result.moonSign = moonMatch[1];
  }

  // Extract Ascendant
  const ascendantMatch = summary.match(/Ascendant[^.]*in\s+([A-Za-z]+)/i) ||
                         summary.match(/Rising[^.]*in\s+([A-Za-z]+)/i) ||
                         summary.match(/Lagna[^.]*in\s+([A-Za-z]+)/i);
  if (ascendantMatch) {
    result.ascendant = ascendantMatch[1];
  }

  // Extract Nakshatra
  const nakshatraMatch = summary.match(/Nakshatra[^:]*:\s*([A-Za-z\s]+?)(?:\n|\.|,)/i);
  if (nakshatraMatch) {
    result.nakshatra = nakshatraMatch[1].trim();
  }

  // Extract key traits (look for bullet points or numbered lists)
  const traitMatches = summary.match(/(?:^|\n)[\s]*[-•*][\s]*([^\n]+)/g);
  if (traitMatches) {
    result.keyTraits = traitMatches
      .map(t => t.replace(/^\s*[-•*]\s*/, '').trim())
      .filter(t => t.length > 0 && t.length < 100)
      .slice(0, 5);
  }

  return result;
}

/**
 * Get zodiac sign emoji
 */
export function getZodiacEmoji(sign?: string): string {
  if (!sign) return '✨';

  const signEmojis: Record<string, string> = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓',
  };

  return signEmojis[sign.toLowerCase()] || '✨';
}

/**
 * Format date for display
 */
export function formatBirthDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format time for display
 */
export function formatBirthTime(timeString: string): string {
  try {
    // Handle both 24h and 12h formats
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }

    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeString;
  }
}

/**
 * Get status color for profile status
 */
export function getStatusColor(status: UserProfile['status']): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-400';
    case 'processing':
      return 'text-amber-400';
    case 'failed':
      return 'text-red-400';
    case 'onboarding':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get status label for profile status
 */
export function getStatusLabel(status: UserProfile['status']): string {
  switch (status) {
    case 'completed':
      return 'Profile Complete';
    case 'processing':
      return 'Processing...';
    case 'failed':
      return 'Processing Failed';
    case 'onboarding':
      return 'Onboarding';
    default:
      return 'Unknown';
  }
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  formatBirthDate,
  formatBirthTime,
  ProfileError,
} from '@/lib/user-profile';
import {
  User,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

function ProfileSkeleton() {
  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
}

function ErrorMessage({ error, onRetry }: { error: ProfileError; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[300px] text-center"
    >
      <p className="text-[var(--text-secondary)] mb-6 text-sm">
        {error.message}
      </p>
      {error.retryable && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] bg-transparent rounded-lg text-sm h-9"
        >
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0"
    >
      <Icon className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{label}</p>
        <p className="text-sm text-[var(--text-primary)] truncate">{value}</p>
      </div>
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-[var(--surface-secondary)] transition-colors text-[var(--text-tertiary)]"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { profile, state, error, refetch, isRefetching } = useUserProfile();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || state === 'loading') {
    return (
      <div className="flex-1 min-h-screen bg-[var(--bg-primary)] p-6 flex items-center justify-center w-full">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-screen bg-[var(--bg-primary)] p-6 flex items-center justify-center w-full">
        <ErrorMessage error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 min-h-screen bg-[var(--bg-primary)] p-6 flex items-center justify-center w-full">
        <ErrorMessage
          error={{
            code: 'UNKNOWN_ERROR',
            message: 'Profile data unavailable',
            retryable: true,
          }}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[var(--bg-primary)] w-full">
      <motion.div
        className="max-w-2xl mx-auto p-6 md:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/chat')}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-transparent p-0 h-auto mb-6 -ml-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="text-sm">Back</span>
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--surface-secondary)] flex-shrink-0">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[var(--text-tertiary)]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">
                {profile.name}
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] truncate">
                {profile.email}
              </p>
            </div>
            {isRefetching && (
              <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
            )}
          </div>
        </motion.div>

        {/* Profile Info */}
        <motion.section variants={itemVariants} className="mb-6">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-lg p-4">
            <InfoRow
              icon={Calendar}
              label="Date of Birth"
              value={profile.birthDetails?.dateOfBirth ? formatBirthDate(profile.birthDetails.dateOfBirth) : 'Not provided'}
            />
            <InfoRow
              icon={Clock}
              label="Time of Birth"
              value={profile.birthDetails?.timeOfBirth ? formatBirthTime(profile.birthDetails.timeOfBirth) : 'Not provided'}
            />
            <InfoRow
              icon={MapPin}
              label="Place of Birth"
              value={profile.birthDetails?.placeOfBirth || 'Not provided'}
            />
          </div>
        </motion.section>

        {/* Astrological Summary */}
        {profile.astroProfile?.astroSummary && (
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-[var(--text-tertiary)]">
                Profile Summary
              </h2>
              <CopyButton text={profile.astroProfile.astroSummary} />
            </div>
            <div className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-lg p-4">
              <div className="prose prose-sm max-w-none prose-p:text-[var(--text-secondary)] prose-p:text-sm prose-p:leading-relaxed prose-headings:text-[var(--text-primary)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {profile.astroProfile.astroSummary}
                </ReactMarkdown>
              </div>
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)]">
            Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

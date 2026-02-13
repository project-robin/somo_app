'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Calendar, Clock, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { astroShivaClient } from '@/lib/api-client';
import { CelestialBackground } from '@/components/CelestialBackground';

interface OnboardingFormData {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

const steps = [
  { id: 'personal', title: 'Name', icon: User },
  { id: 'birth', title: 'Birth', icon: Calendar },
  { id: 'location', title: 'Place', icon: MapPin },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '12:00',
    place: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'processing'>('form');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setError('Please sign in before completing onboarding.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await astroShivaClient.onboarding({
        name: formData.name,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        timeOfBirth: formData.timeOfBirth,
        place: formData.place,
        latitude: formData.latitude,
        longitude: formData.longitude,
        timezone: formData.timezone,
      });

      if (response.success) {
        setStep('processing');

        try {
          const profile = await astroShivaClient.pollProfileStatus(
            undefined,
            20,
            3000
          );

          if (profile.success && profile.data.status === 'completed') {
            router.push('/chat');
          }
        } catch (pollError) {
          setError(pollError instanceof Error ? pollError.message : 'Failed to verify onboarding status');
          setIsLoading(false);
          setStep('form');
        }
      } else {
        setError(response.message || 'Onboarding failed');
        setIsLoading(false);
      }
    } catch (err) {
      let errorMessage = 'An unexpected error occurred';

      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please ensure you are signed in and try again.';
        } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name.length >= 2;
      case 1:
        return formData.dateOfBirth && formData.timeOfBirth;
      case 2:
        return formData.place.length >= 2 && formData.latitude !== 0 && formData.longitude !== 0;
      default:
        return false;
    }
  };

  const isFormValid = () => {
    return (
      formData.name.length >= 2 &&
      formData.dateOfBirth &&
      formData.timeOfBirth &&
      formData.place.length >= 2 &&
      formData.latitude >= -90 &&
      formData.latitude <= 90 &&
      formData.longitude >= -180 &&
      formData.longitude <= 180
    );
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-3 sm:p-4 bg-[var(--bg-primary)] w-full grok relative overflow-hidden">
      <CelestialBackground starCount={40} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg mx-auto relative z-10 safe-area-pt safe-area-pb"
      >
        <div className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-8 backdrop-blur-xl">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-2 font-playfair italic">
              Your Profile
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-tertiary)] font-light tracking-wide">
              Initialize your cosmic blueprint
            </p>
          </div>

          {step === 'form' && (
            <>
              <div className="flex items-center justify-center gap-1.5 mb-10">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                        i <= currentStep ? 'bg-[var(--text-primary)] scale-125' : 'bg-[var(--border-default)]'
                      }`}
                    />
                    {i < steps.length - 1 && (
                      <div className={`w-8 h-px mx-1.5 transition-colors duration-500 ${i < currentStep ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-default)]'}`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider ml-1">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          minLength={2}
                          maxLength={100}
                          className="bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)] rounded-xl h-12 text-base sm:text-sm transition-all duration-300 touch-manipulation"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider ml-1">
                          Date of Birth
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          required
                          className="bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl h-12 text-base sm:text-sm transition-all duration-300 touch-manipulation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeOfBirth" className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider ml-1">
                          Time of Birth
                        </Label>
                        <Input
                          id="timeOfBirth"
                          type="time"
                          value={formData.timeOfBirth}
                          onChange={(e) => setFormData({ ...formData, timeOfBirth: e.target.value })}
                          required
                          className="bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl h-12 text-base sm:text-sm transition-all duration-300 touch-manipulation"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="place" className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider ml-1">
                          Place of Birth
                        </Label>
                        <Input
                          id="place"
                          type="text"
                          placeholder="City, Country"
                          value={formData.place}
                          onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                          required
                          minLength={2}
                          className="bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)] rounded-xl h-12 text-base sm:text-sm transition-all duration-300 touch-manipulation"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude" className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider ml-1">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="0.0001"
                            placeholder="40.7128"
                            value={formData.latitude || ''}
                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                            required
                            min={-90}
                            max={90}
                            className="bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl h-12 text-base sm:text-sm transition-all duration-300 touch-manipulation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude" className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-wider ml-1">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="0.0001"
                            placeholder="-74.0060"
                            value={formData.longitude || ''}
                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                            required
                            min={-180}
                            max={180}
                            className="bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl h-12 text-base sm:text-sm transition-all duration-300 touch-manipulation"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl h-11 sm:h-10 text-[10px] font-bold uppercase tracking-widest touch-manipulation"
                        onClick={handleGetCurrentLocation}
                      >
                        <MapPin className="w-3.5 h-3.5 mr-2" />
                        Use Current Location
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--error-soft)] border border-[var(--error-soft)] text-[var(--text-secondary)] p-4 rounded-xl text-xs leading-relaxed"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-2 sm:gap-3 pt-4">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={prevStep}
                      className="flex-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl h-12 text-sm touch-manipulation"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="flex-1 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-xl h-12 text-sm font-medium transition-all duration-300 disabled:opacity-30 touch-manipulation"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!isFormValid() || isLoading}
                      className="flex-1 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-xl h-12 text-sm font-medium transition-all duration-300 disabled:opacity-30 touch-manipulation"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        <>
                          Finalize
                          <Check className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </>
          )}

          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 mx-auto mb-6 rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--text-primary)]"
              />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2 font-playfair italic">
                Architecting your profile
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] font-light tracking-wide">
                Aligning the stars...
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

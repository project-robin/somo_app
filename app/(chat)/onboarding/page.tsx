'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Calendar, Clock, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { astroShivaClient } from '@/lib/api-client';

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
    <div className="flex-1 min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)] w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
              Your Profile
            </h1>
            <p className="text-sm text-[var(--text-tertiary)]">
              Tell us about yourself
            </p>
          </div>

          {step === 'form' && (
            <>
              <div className="flex items-center justify-center gap-1 mb-6">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i <= currentStep ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-default)]'
                      }`}
                    />
                    {i < steps.length - 1 && (
                      <div className={`w-6 h-px mx-1 ${i < currentStep ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-default)]'}`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-3"
                    >
                      <div>
                        <Label htmlFor="name" className="text-[var(--text-secondary)] text-sm mb-2 block">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          minLength={2}
                          maxLength={100}
                          className="bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-hover)] rounded-lg h-10 text-sm"
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
                      className="space-y-3"
                    >
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-[var(--text-secondary)] text-sm mb-2 block">
                          Date of Birth
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          required
                          className="bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg h-10 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeOfBirth" className="text-[var(--text-secondary)] text-sm mb-2 block">
                          Time of Birth
                        </Label>
                        <Input
                          id="timeOfBirth"
                          type="time"
                          value={formData.timeOfBirth}
                          onChange={(e) => setFormData({ ...formData, timeOfBirth: e.target.value })}
                          required
                          className="bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg h-10 text-sm"
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
                      className="space-y-3"
                    >
                      <div>
                        <Label htmlFor="place" className="text-[var(--text-secondary)] text-sm mb-2 block">
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
                          className="bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-hover)] rounded-lg h-10 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="latitude" className="text-[var(--text-secondary)] text-sm mb-2 block">Latitude</Label>
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
                            className="bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg h-10 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="longitude" className="text-[var(--text-secondary)] text-sm mb-2 block">Longitude</Label>
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
                            className="bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg h-10 text-sm"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] bg-transparent rounded-lg h-9 text-sm"
                        onClick={handleGetCurrentLocation}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Use Current Location
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] p-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-2 pt-2">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] bg-transparent rounded-lg h-9 text-sm"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="flex-1 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-lg h-9 text-sm disabled:opacity-50"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!isFormValid() || isLoading}
                      className="flex-1 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-lg h-9 text-sm disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="animate-pulse">Creating...</span>
                      ) : (
                        <>
                          Continue
                          <Check className="w-4 h-4 ml-1" />
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
              className="text-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 mx-auto mb-4 rounded-full border border-[var(--border-default)] border-t-[var(--text-primary)]"
              />
              <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">
                Creating your profile
              </h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                Please wait...
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import * as Linking from 'expo-linking';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePersistence } from './persistence-context';

// Types
export interface UserPreferences {
  goals: string[];
  dailyGoal: number;
  focusDomain?: string;
  onboardingCompletedAt: number;
}

interface OnboardingContextType {
  // State
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  selectedGoals: string[];
  dailyGoal: number;
  focusDomain: string | null;

  // Actions
  toggleGoal: (goalId: string) => void;
  setDailyGoal: (goal: number) => void;
  setFocusDomain: (domain: string | null) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { kv } = usePersistence();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [dailyGoal, setDailyGoalState] = useState(2);
  const [focusDomain, setFocusDomainState] = useState<string | null>(null);

  // Check a URL for ?skipOnboarding=true and auto-complete if found
  const handleSkipOnboardingUrl = useCallback(async (url: string) => {
    const { queryParams } = Linking.parse(url);
    if (queryParams?.skipOnboarding !== 'true') return false;

    const defaults: UserPreferences = {
      goals: ['pass-pmp'],
      dailyGoal: 2,
      onboardingCompletedAt: Date.now(),
    };
    await Promise.all([
      kv.setString('hasCompletedOnboarding', 'true'),
      kv.setJSON('userPreferences', defaults),
    ]);
    setSelectedGoals(defaults.goals);
    setDailyGoalState(defaults.dailyGoal);
    setHasCompletedOnboarding(true);
    return true;
  }, [kv]);

  // Load onboarding status on mount
  useEffect(() => {
    async function loadOnboardingStatus() {
      try {
        const [status, preferences] = await Promise.all([
          kv.getString('hasCompletedOnboarding'),
          kv.getJSON<UserPreferences>('userPreferences'),
        ]);

        if (status === 'true') {
          setHasCompletedOnboarding(true);
          if (preferences) {
            setSelectedGoals(preferences.goals || []);
            setDailyGoalState(preferences.dailyGoal || 2);
            setFocusDomainState(preferences.focusDomain || null);
          }
          return;
        }

        // Check initial deep link for ?skipOnboarding=true (cold start)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && (await handleSkipOnboardingUrl(initialUrl))) return;

        setHasCompletedOnboarding(false);
      } catch (error) {
        console.error('Error loading onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOnboardingStatus();
  }, [handleSkipOnboardingUrl, kv]);

  // Listen for in-app deep links with ?skipOnboarding=true (app already running)
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      handleSkipOnboardingUrl(event.url);
    });
    return () => subscription.remove();
  }, [handleSkipOnboardingUrl]);

  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  }, []);

  const setDailyGoal = useCallback((goal: number) => {
    setDailyGoalState(Math.max(1, Math.min(5, goal)));
  }, []);

  const setFocusDomain = useCallback((domain: string | null) => {
    setFocusDomainState(domain);
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      const preferences: UserPreferences = {
        goals: selectedGoals.length > 0 ? selectedGoals : ['pass-pmp'],
        dailyGoal,
        focusDomain: focusDomain || undefined,
        onboardingCompletedAt: Date.now(),
      };

      await Promise.all([
        kv.setString('hasCompletedOnboarding', 'true'),
        kv.setJSON('userPreferences', preferences),
      ]);

      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }, [selectedGoals, dailyGoal, focusDomain, kv]);

  const resetOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        kv.remove('hasCompletedOnboarding'),
        kv.remove('userPreferences'),
      ]);

      setHasCompletedOnboarding(false);
      setSelectedGoals([]);
      setDailyGoalState(2);
      setFocusDomainState(null);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  }, [kv]);

  const value = useMemo(
    () => ({
      isLoading,
      hasCompletedOnboarding,
      selectedGoals,
      dailyGoal,
      focusDomain,
      toggleGoal,
      setDailyGoal,
      setFocusDomain,
      completeOnboarding,
      resetOnboarding,
    }),
    [
      isLoading,
      hasCompletedOnboarding,
      selectedGoals,
      dailyGoal,
      focusDomain,
      toggleGoal,
      setDailyGoal,
      setFocusDomain,
      completeOnboarding,
      resetOnboarding,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

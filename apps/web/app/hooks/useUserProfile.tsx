'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserProfile {
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    createdAt: Date;
  };
  organization: {
    id: string;
    name: string;
    createdAt: Date;
  };
  plan: {
    code: string;
    name: string;
    monthlyCreditsTokens: number;
    dailyTokenLimit: number;
    storageLimitMB: number;
    maxFileSizeMB: number;
    features: any;
    stripePriceId: string | null;
    stripeProductId: string | null;
  };
  subscription: {
    id: string;
    active: boolean;
    stripeSubscriptionId: string | null;
    stripeStatus: string | null;
    periodStart: Date;
    periodEnd: Date;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    nextBilling: Date | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
  } | null;
  usage: {
    currentPeriod: {
      start: Date;
      end: Date;
      totalTokens: number;
      totalRequests: number;
      threadsCreated: number;
    };
    totalThreads: number;
    accountSince: Date;
  };
  billing: {
    paymentMethod: {
      type: string;
      last4: string;
      brand: string;
    } | null;
    nextBilling: Date | null;
    amount: number;
    currency: string;
  };
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: { name?: string; preferences?: any }) => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!session?.user?.email) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; preferences?: any }) => {
    if (!session?.user?.email) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Atualizar profile local
      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            ...result.user
          }
        });
      }

      return result;
    } catch (err) {
      console.error('Error updating user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  };
}
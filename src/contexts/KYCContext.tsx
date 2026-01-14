import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface KYCData {
  fullName: string;
  idNumber: string;
  idType: 'passport' | 'driver_license' | 'national_id' | 'other';
  idImage: string | null;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
  rejectReason?: string;
}

interface KYCContextType {
  kycData: KYCData;
  submitKYC: (data: Omit<KYCData, 'status' | 'submittedAt' | 'rejectReason'>) => Promise<boolean>;
  isVerified: boolean;
  refreshKYCStatus: () => Promise<void>;
  isLoading: boolean;
}

const defaultKYCData: KYCData = {
  fullName: '',
  idNumber: '',
  idType: 'passport',
  idImage: null,
  status: 'not_submitted',
};

const KYCContext = createContext<KYCContextType | undefined>(undefined);

export const KYCProvider = ({ children }: { children: ReactNode }) => {
  const [kycData, setKYCData] = useState<KYCData>(defaultKYCData);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const refreshKYCStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setKYCData(defaultKYCData);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kyc_records')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch KYC status:', error);
        return;
      }

      if (data) {
        setKYCData({
          fullName: data.real_name,
          idNumber: data.id_number,
          idType: data.id_type as KYCData['idType'],
          idImage: data.front_image_url,
          status: data.status as KYCData['status'],
          submittedAt: new Date(data.created_at),
          rejectReason: data.reject_reason || undefined,
        });
      } else {
        setKYCData(defaultKYCData);
      }
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshKYCStatus();
  }, [refreshKYCStatus]);

  const submitKYC = async (data: Omit<KYCData, 'status' | 'submittedAt' | 'rejectReason'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('kyc_records')
        .upsert({
          user_id: user.id,
          real_name: data.fullName,
          id_number: data.idNumber,
          id_type: data.idType,
          front_image_url: data.idImage,
          status: 'pending',
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('KYC submission failed:', error);
        return false;
      }

      await refreshKYCStatus();
      return true;
    } catch (error) {
      console.error('KYC submission failed:', error);
      return false;
    }
  };

  const isVerified = kycData.status === 'approved';

  return (
    <KYCContext.Provider value={{ kycData, submitKYC, isVerified, refreshKYCStatus, isLoading }}>
      {children}
    </KYCContext.Provider>
  );
};

export const useKYC = () => {
  const context = useContext(KYCContext);
  if (!context) {
    throw new Error('useKYC must be used within a KYCProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type VerificationLevel = 'none' | 'primary' | 'advanced';

export interface KYCData {
  fullName: string;
  idNumber: string;
  idType: 'passport' | 'driver_license' | 'national_id' | 'other';
  frontImageUrl: string | null;
  backImageUrl: string | null;
  selfieUrl: string | null;
  verificationLevel: VerificationLevel;
  primaryStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  advancedStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
  rejectReason?: string;
}

interface KYCContextType {
  kycData: KYCData;
  submitPrimaryKYC: (data: { fullName: string; idNumber: string; idType: string }) => Promise<boolean>;
  submitAdvancedKYC: (data: { frontImageUrl: string; backImageUrl?: string; selfieUrl?: string }) => Promise<boolean>;
  isPrimaryVerified: boolean;
  isAdvancedVerified: boolean;
  isVerified: boolean;
  refreshKYCStatus: () => Promise<void>;
  isLoading: boolean;
}

const defaultKYCData: KYCData = {
  fullName: '',
  idNumber: '',
  idType: 'passport',
  frontImageUrl: null,
  backImageUrl: null,
  selfieUrl: null,
  verificationLevel: 'none',
  primaryStatus: 'not_submitted',
  advancedStatus: 'not_submitted',
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
        const verificationLevel = data.verification_level as VerificationLevel;
        const status = data.status as 'pending' | 'approved' | 'rejected';
        
        // Determine primary and advanced status based on verification_level and overall status
        let primaryStatus: KYCData['primaryStatus'] = 'not_submitted';
        let advancedStatus: KYCData['advancedStatus'] = 'not_submitted';
        
        if (verificationLevel === 'primary') {
          primaryStatus = status;
        } else if (verificationLevel === 'advanced') {
          // If advanced is submitted, primary must be approved
          primaryStatus = 'approved';
          advancedStatus = status;
        }
        
        setKYCData({
          fullName: data.real_name,
          idNumber: data.id_number,
          idType: data.id_type as KYCData['idType'],
          frontImageUrl: data.front_image_url,
          backImageUrl: data.back_image_url,
          selfieUrl: data.selfie_url,
          verificationLevel,
          primaryStatus,
          advancedStatus,
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

  const submitPrimaryKYC = async (data: { fullName: string; idNumber: string; idType: string }): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('kyc_records')
        .upsert({
          user_id: user.id,
          real_name: data.fullName,
          id_number: data.idNumber,
          id_type: data.idType,
          verification_level: 'primary',
          status: 'pending',
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Primary KYC submission failed:', error);
        return false;
      }

      await refreshKYCStatus();
      return true;
    } catch (error) {
      console.error('Primary KYC submission failed:', error);
      return false;
    }
  };

  const submitAdvancedKYC = async (data: { frontImageUrl: string; backImageUrl?: string; selfieUrl?: string }): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('kyc_records')
        .update({
          front_image_url: data.frontImageUrl,
          back_image_url: data.backImageUrl || null,
          selfie_url: data.selfieUrl || null,
          verification_level: 'advanced',
          status: 'pending',
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Advanced KYC submission failed:', error);
        return false;
      }

      await refreshKYCStatus();
      return true;
    } catch (error) {
      console.error('Advanced KYC submission failed:', error);
      return false;
    }
  };

  const isPrimaryVerified = kycData.primaryStatus === 'approved';
  const isAdvancedVerified = kycData.advancedStatus === 'approved';
  const isVerified = isPrimaryVerified; // Primary is enough for basic features

  return (
    <KYCContext.Provider value={{ 
      kycData, 
      submitPrimaryKYC, 
      submitAdvancedKYC, 
      isPrimaryVerified,
      isAdvancedVerified,
      isVerified, 
      refreshKYCStatus, 
      isLoading 
    }}>
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

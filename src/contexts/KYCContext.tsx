import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api, VerifyRequest, ApplicationResponse } from '@/lib/api';

export interface KYCData {
  fullName: string;
  idNumber: string;
  idType: 'passport' | 'driver_license' | 'national_id' | 'other';
  idImage: string | null;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
}

interface KYCContextType {
  kycData: KYCData;
  submitKYC: (data: Omit<KYCData, 'status' | 'submittedAt'>) => Promise<boolean>;
  isVerified: boolean;
  refreshKYCStatus: () => Promise<void>;
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
  const [kycData, setKYCData] = useState<KYCData>(() => {
    const saved = localStorage.getItem('kycData');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        submittedAt: parsed.submittedAt ? new Date(parsed.submittedAt) : undefined,
      };
    }
    return defaultKYCData;
  });

  const refreshKYCStatus = async () => {
    if (!api.isAuthenticated()) return;
    
    try {
      const response = await api.get<{ status: KYCData['status']; data?: Partial<KYCData> }>('/user/kyc-status');
      
      if (response.status) {
        setKYCData(prev => {
          const updated = {
            ...prev,
            status: response.status,
            ...response.data,
          };
          localStorage.setItem('kycData', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to refresh KYC status:', error);
    }
  };

  const submitKYC = async (data: Omit<KYCData, 'status' | 'submittedAt'>): Promise<boolean> => {
    try {
      const request: VerifyRequest = {
        fullName: data.fullName,
        idNumber: data.idNumber,
        idType: data.idType,
        idImage: data.idImage,
      };

      await api.post<ApplicationResponse>('/applications/verify', request);

      const newData: KYCData = {
        ...data,
        status: 'pending',
        submittedAt: new Date(),
      };
      setKYCData(newData);
      localStorage.setItem('kycData', JSON.stringify(newData));
      
      return true;
    } catch (error) {
      console.error('KYC submission failed:', error);
      return false;
    }
  };

  const isVerified = kycData.status === 'approved';

  return (
    <KYCContext.Provider value={{ kycData, submitKYC, isVerified, refreshKYCStatus }}>
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

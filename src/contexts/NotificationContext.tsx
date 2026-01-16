import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLoan, Loan } from './LoanContext';
import { useLanguage } from './LanguageContext';

export interface Notification {
  id: string;
  type: 'loan_reminder' | 'system' | 'info';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  loanId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [checkedLoans, setCheckedLoans] = useState<Set<string>>(new Set());
  const { loans } = useLoan();
  const { t } = useLanguage();

  // Helper function to replace placeholders in translated strings
  const formatMessage = (template: string, values: Record<string, string | number>) => {
    let result = template;
    Object.entries(values).forEach(([key, value]) => {
      result = result.replace(`{${key}}`, String(value));
    });
    return result;
  };

  const checkLoanReminders = useCallback(() => {
    const now = new Date();
    // Active loans are those with 'approved' or 'overdue' status
    const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'overdue');
    
    activeLoans.forEach(loan => {
      const borrowDate = new Date(loan.borrowDate);
      const daysElapsed = Math.floor((now.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Interest-free period is 7 days
      const daysUntilDue = 7 - daysElapsed;
      
      // Reminder 3 days before due (days 4-5)
      const threeDayKey = `${loan.id}_3day`;
      if (daysUntilDue <= 3 && daysUntilDue > 1 && !checkedLoans.has(threeDayKey)) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'loan_reminder',
          title: t('notification.loanSoonDue.title'),
          message: formatMessage(t('notification.loanSoonDue.message'), {
            amount: loan.amount.toLocaleString(),
            currency: loan.currency,
            days: daysUntilDue
          }),
          createdAt: new Date(),
          read: false,
          loanId: loan.id
        };
        setNotifications(prev => [notification, ...prev]);
        setCheckedLoans(prev => new Set(prev).add(threeDayKey));
      }
      
      // Reminder 1 day before due (day 6)
      const oneDayKey = `${loan.id}_1day`;
      if (daysUntilDue === 1 && !checkedLoans.has(oneDayKey)) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'loan_reminder',
          title: t('notification.loanTomorrow.title'),
          message: formatMessage(t('notification.loanTomorrow.message'), {
            amount: loan.amount.toLocaleString(),
            currency: loan.currency
          }),
          createdAt: new Date(),
          read: false,
          loanId: loan.id
        };
        setNotifications(prev => [notification, ...prev]);
        setCheckedLoans(prev => new Set(prev).add(oneDayKey));
      }
      
      // Overdue reminder
      const overdueKey = `${loan.id}_overdue`;
      if (daysUntilDue < 0 && !checkedLoans.has(overdueKey)) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'loan_reminder',
          title: t('notification.loanOverdue.title'),
          message: formatMessage(t('notification.loanOverdue.message'), {
            amount: loan.amount.toLocaleString(),
            currency: loan.currency,
            days: Math.abs(daysUntilDue)
          }),
          createdAt: new Date(),
          read: false,
          loanId: loan.id
        };
        setNotifications(prev => [notification, ...prev]);
        setCheckedLoans(prev => new Set(prev).add(overdueKey));
      }
    });
  }, [loans, checkedLoans, t]);

  useEffect(() => {
    checkLoanReminders();
    // Check every hour
    const interval = setInterval(checkLoanReminders, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkLoanReminders]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      clearNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

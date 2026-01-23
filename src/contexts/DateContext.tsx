
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { format } from 'date-fns';

interface DateContextType {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  resetToToday: () => void;
  formatDate: (date: Date, formatString?: string) => string;
  isManuallySet: boolean;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

interface DateProviderProps {
  children: ReactNode;
}

export const DateProvider: React.FC<DateProviderProps> = ({ children }) => {
  const [currentDate, setCurrentDateState] = useState<Date>(new Date()); // Current date
  const [isManuallySet, setIsManuallySet] = useState(false); // Not manually set initially

  const setCurrentDate = (date: Date) => {
    setCurrentDateState(date);
    setIsManuallySet(true);
  };

  const resetToToday = () => {
    setCurrentDateState(new Date());
    setIsManuallySet(false);
  };

  const formatDate = (date: Date, formatString: string = 'yyyy-MM-dd') => {
    return format(date, formatString);
  };

  return (
    <DateContext.Provider value={{
      currentDate,
      setCurrentDate,
      resetToToday,
      formatDate,
      isManuallySet
    }}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = (): DateContextType => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};

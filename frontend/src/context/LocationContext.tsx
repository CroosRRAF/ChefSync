import React, { createContext, useState, useContext, ReactNode } from 'react';

interface LocationState {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface LocationContextType {
  location: LocationState;
  setLocation: (location: LocationState) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationState>({
    address: 'New York, NY', // Default or initial location
    latitude: 40.7128,
    longitude: -74.0060,
  });

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

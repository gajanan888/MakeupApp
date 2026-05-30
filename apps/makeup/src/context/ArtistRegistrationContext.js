import React, { createContext, useContext, useMemo, useState } from 'react';

const ArtistRegistrationContext = createContext(null);

const initialState = {
  basic: {
    name: '',
    email: '',
    phone: '',
    password: '',
  },
  profile: {
    profileImage: '',
    gender: '',
    bio: '',
    location: '',
    experience: '',
  },
  specializations: [],
  certificates: [],
  services: [],
  portfolio: [],
  payment: {
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  },
};

export const ArtistRegistrationProvider = ({ children }) => {
  const [data, setData] = useState(initialState);

  const setBasicInfo = next => {
    setData(prev => ({
      ...prev,
      basic: { ...prev.basic, ...next },
    }));
  };

  const setProfileInfo = next => {
    setData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...next },
    }));
  };

  const setSpecializations = specializations => {
    setData(prev => ({
      ...prev,
      specializations: Array.isArray(specializations) ? specializations : [],
    }));
  };

  const setCertificates = certificates => {
    setData(prev => ({
      ...prev,
      certificates: Array.isArray(certificates) ? certificates : [],
    }));
  };

  const setServices = services => {
    setData(prev => ({
      ...prev,
      services: Array.isArray(services) ? services : [],
    }));
  };

  const setPortfolio = portfolio => {
    setData(prev => ({
      ...prev,
      portfolio: Array.isArray(portfolio) ? portfolio : [],
    }));
  };

  const setPayment = payment => {
    setData(prev => ({
      ...prev,
      payment: { ...prev.payment, ...payment },
    }));
  };

  const resetRegistration = () => {
    setData(initialState);
  };

  const value = useMemo(
    () => ({
      data,
      setBasicInfo,
      setProfileInfo,
      setSpecializations,
      setCertificates,
      setServices,
      setPortfolio,
      setPayment,
      resetRegistration,
    }),
    [data],
  );

  return (
    <ArtistRegistrationContext.Provider value={value}>
      {children}
    </ArtistRegistrationContext.Provider>
  );
};

export const useArtistRegistration = () => {
  const context = useContext(ArtistRegistrationContext);
  if (!context) {
    throw new Error(
      'useArtistRegistration must be used within ArtistRegistrationProvider',
    );
  }
  return context;
};

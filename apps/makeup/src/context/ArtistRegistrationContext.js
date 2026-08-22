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
    parlourName: '',
    parlourAddress: '',
    languages: [],
    homeService: '',
    travelToClient: false,
    travelArea: '',
    travelChargesType: '',
    travelChargeAmount: '',
    trainingMethod: '',
    trainingDetails: '',
    notableWork: '',
    brandsUsed: [],
    productsUsed: '',
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
  bookingPolicy: {
    advanceNotice: '',
    trialType: '',
    trialPrice: '',
    requiresAdvance: false,
    advanceType: '',
    advanceValue: '',
    cancellationPolicy: '',
    cancellationPolicyCustom: '',
  },
  socialLinks: {
    instagram: '',
    facebook: '',
    youtube: '',
    website: '',
    whatsapp: '',
  },
  artistTypeInfo: {
    artistType: '',
    businessName: '',
    ownerName: '',
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

  const setBookingPolicy = bookingPolicy => {
    setData(prev => ({
      ...prev,
      bookingPolicy: { ...prev.bookingPolicy, ...bookingPolicy },
    }));
  };

  const setSocialLinks = socialLinks => {
    setData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, ...socialLinks },
    }));
  };

  const setArtistTypeInfo = artistTypeInfo => {
    setData(prev => ({
      ...prev,
      artistTypeInfo: { ...prev.artistTypeInfo, ...artistTypeInfo },
    }));
  };

  const resetRegistration = () => {
    setData(initialState);
  };

  const loadProfileData = (profileData) => {
    if (!profileData) return;
    setData({
      basic: {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        password: '',
      },
      profile: {
        profileImage: profileData.profile?.profileImage || '',
        gender: profileData.profile?.gender || '',
        bio: profileData.profile?.bio || '',
        location: profileData.profile?.location || '',
        experience: profileData.profile?.experience || '',
        parlourName: profileData.profile?.parlourName || '',
        parlourAddress: profileData.profile?.parlourAddress || '',
        languages: profileData.profile?.languages || [],
        homeService: profileData.profile?.homeService || '',
        travelToClient: profileData.profile?.travelToClient || false,
        travelArea: profileData.profile?.travelArea || '',
        travelChargesType: profileData.profile?.travelChargesType || '',
        travelChargeAmount: profileData.profile?.travelChargeAmount || '',
        trainingMethod: profileData.profile?.trainingMethod || '',
        trainingDetails: profileData.profile?.trainingDetails || '',
        notableWork: profileData.profile?.notableWork || '',
        brandsUsed: profileData.profile?.brandsUsed || [],
        productsUsed: profileData.profile?.productsUsed || '',
      },
      specializations: (profileData.specializations || []).map(s => s.name || s),
      certificates: (profileData.certificates || []).map(c => ({
        id: c.id || Date.now() + Math.random(),
        file: c.fileUrl ? { name: c.fileName || 'Certificate', url: c.fileUrl, size: c.fileSize, type: c.fileType } : null,
        certificateNumber: c.certificateNumber || '',
        instituteName: c.instituteName || '',
        error: '',
      })),
      services: (profileData.services || []).map(s => ({
        id: s.id || Date.now() + Math.random(),
        specialization: s.specialization || '',
        duration: s.duration || '',
        timeRange: s.timeRange || '',
        priceRange: s.priceRange || '',
      })),
      portfolio: (profileData.portfolio || []).map(p => ({
        id: p.id || Date.now() + Math.random(),
        beforeImage: p.beforeImageUrl || p.beforeImage || '',
        afterImage: p.afterImageUrl || p.afterImage || '',
        images: Array.isArray(p.images) ? p.images : (p.afterImageUrl || p.afterImage ? [p.afterImageUrl || p.afterImage] : []),
        tag: p.tag || '',
        description: p.description || '',
      })),
      payment: {
        accountHolder: profileData.payment?.accountHolder || '',
        bankName: profileData.payment?.bankName || '',
        accountNumber: profileData.payment?.accountNumber || '',
        ifscCode: profileData.payment?.ifscCode || '',
        upiId: profileData.payment?.upiId || '',
      },
      bookingPolicy: {
        advanceNotice: profileData.bookingPolicy?.advanceNotice || '',
        trialType: profileData.bookingPolicy?.trialType || '',
        trialPrice: profileData.bookingPolicy?.trialPrice || '',
        requiresAdvance: profileData.bookingPolicy?.requiresAdvance || false,
        advanceType: profileData.bookingPolicy?.advanceType || '',
        advanceValue: profileData.bookingPolicy?.advanceValue || '',
        cancellationPolicy: profileData.bookingPolicy?.cancellationPolicy || '',
        cancellationPolicyCustom: profileData.bookingPolicy?.cancellationPolicyCustom || '',
      },
      socialLinks: {
        instagram: profileData.socialLinks?.instagram || '',
        facebook: profileData.socialLinks?.facebook || '',
        youtube: profileData.socialLinks?.youtube || '',
        website: profileData.socialLinks?.website || '',
        whatsapp: profileData.socialLinks?.whatsapp || '',
      },
      artistTypeInfo: {
        artistType: profileData.artistType || '',
        businessName: profileData.businessName || '',
        ownerName: profileData.ownerName || '',
      },
    });
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
      setBookingPolicy,
      setSocialLinks,
      setArtistTypeInfo,
      resetRegistration,
      loadProfileData,
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

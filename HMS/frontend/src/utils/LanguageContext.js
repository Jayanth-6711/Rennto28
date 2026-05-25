import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage) {
        setLanguage(savedLanguage);
        setIsLanguageSelected(true);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (newLang) => {
    try {
      await AsyncStorage.setItem('userLanguage', newLang);
      setLanguage(newLang);
      setIsLanguageSelected(true);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isLanguageSelected, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/LanguageContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const languages = [
  { id: 'en', name: 'English', subName: 'Default', icon: '🇺🇸' },
  { id: 'hi', name: 'हिन्दी', subName: 'Hindi', icon: '🟠' },
  { id: 'te', name: 'తెలుగు', subName: 'Telugu', icon: '🔵' },
  { id: 'kn', name: 'ಕನ್ನಡ', subName: 'Kannada', icon: '🟢' },
  { id: 'ta', name: 'தமிழ்', subName: 'Tamil', icon: '🟣' },
];

export default function LanguageSelectionScreen({ onFinish }) {
  const { language, changeLanguage, t } = useLanguage();
  const [selected, setSelected] = useState(language);

  const handleContinue = () => {
    changeLanguage(selected);
    if (onFinish) onFinish();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F5F3FF', '#EDE9FE', '#DDD6FE']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="language" size={40} color="#7A3FC4" />
            </View>
            <Text style={styles.title}>Choose Your Language</Text>
            <Text style={styles.subtitle}>Select your preferred language to continue</Text>
          </Animated.View>

          <View style={styles.langGrid}>
            {languages.map((item, index) => (
              <Animated.View 
                key={item.id} 
                entering={FadeInUp.delay(400 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={[
                    styles.langCard,
                    selected === item.id && styles.selectedCard
                  ]}
                  onPress={() => setSelected(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.emojiIcon}>{item.icon}</Text>
                    <View>
                      <Text style={[styles.langName, selected === item.id && styles.selectedText]}>
                        {item.name}
                      </Text>
                      <Text style={styles.langSubName}>{item.subName}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radio,
                    selected === item.id && styles.radioSelected
                  ]}>
                    {selected === item.id && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <LinearGradient
              colors={['#7A3FC4', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7A3FC4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  langGrid: {
    gap: 16,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#7A3FC4',
    backgroundColor: '#F5F3FF',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emojiIcon: {
    fontSize: 24,
  },
  langName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  selectedText: {
    color: '#7A3FC4',
  },
  langSubName: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#7A3FC4',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7A3FC4',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(245, 243, 255, 0.8)',
  },
  button: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7A3FC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

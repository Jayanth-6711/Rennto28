import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { fetchWithAuth } from '../config/Api';
import { BASE_URL } from '../config/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure notifications show up even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.appOwnership === 'expo') {
    console.warn('Push notifications are not supported in Expo Go for SDK 53+. Please use a development build.');
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
         console.warn('Project ID not found. Fallback to normal getExpoPushTokenAsync may fail if using EAS.');
      }
      token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      console.log("Expo Push Token:", token.data);
      return token.data;
    } catch (e) {
      console.error('Error fetching push token:', e);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    return null;
  }
}

export async function sendPushTokenToBackend(phone, role) {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return;

    // Send token to backend
    const response = await fetchWithAuth(`${BASE_URL}/api/save-push-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        role: role,
        push_token: token,
      }),
    });

    if (response.ok) {
      console.log('Push token successfully registered with backend!');
    } else {
      console.error('Failed to register push token with backend.');
    }
  } catch (error) {
    console.error('Error sending push token:', error);
  }
}

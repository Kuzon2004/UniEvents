import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

interface Event {
  id: string;
  eventName: string;
  venueDetails: { building: string; floor: string; room: string };
  organizerInfo: { name: string; phoneNumber: string };
  dateTime: { toDate: () => Date };
}

export function useNotificationScheduler() {
  useEffect(() => {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  // Request permissions and get token
  async function registerForPushNotificationsAsync() {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  }

  // Schedule notification at given date with content
  async function scheduleNotification(event: Event) {
    try {
      console.log('Scheduling notification for event:', event);
      const { id, eventName, venueDetails, organizerInfo, dateTime } = event;
      if (!dateTime) {
        console.warn('No dateTime provided for event:', eventName);
        return;
      }

      const eventDate = dateTime.toDate();
      console.log('Event date:', eventDate);

      // Schedule notification 1 hour before
      const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > new Date()) {
        console.log('Scheduling 1 hour notification at:', oneHourBefore);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Upcoming Event: ${eventName}`,
            body: `Starts in 1 hour at ${venueDetails.building}, floor ${venueDetails.floor}, room ${venueDetails.room}. Organizer: ${organizerInfo.name}, contact: ${organizerInfo.phoneNumber}.`,
            data: { eventId: id },
          },
          trigger: oneHourBefore as any,
        });
        console.log('1 hour notification scheduled successfully');
      } else {
        console.log('1 hour before is in the past, skipping');
      }

      // Schedule notification 10 minutes before
      const tenMinutesBefore = new Date(eventDate.getTime() - 10 * 60 * 1000);
      if (tenMinutesBefore > new Date()) {
        console.log('Scheduling 10 minutes notification at:', tenMinutesBefore);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Upcoming Event: ${eventName}`,
            body: `Starts in 10 minutes at ${venueDetails.building}, floor ${venueDetails.floor}, room ${venueDetails.room}. Organizer: ${organizerInfo.name}, contact: ${organizerInfo.phoneNumber}.`,
            data: { eventId: id },
          },
          trigger: tenMinutesBefore as any,
        });
        console.log('10 minutes notification scheduled successfully');
      } else {
        console.log('10 minutes before is in the past, skipping');
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  return {
    registerForPushNotificationsAsync,
    scheduleNotification,
  };
}

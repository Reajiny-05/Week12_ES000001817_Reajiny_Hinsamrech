import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Button, Platform, Text, View } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  })
})

async function sendPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Original Title',
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    handleRegistrationError('Permission not granted to get push token for push notification!');
    return;
  }
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    handleRegistrationError('Project ID not found');
  }
  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log(pushTokenString);
    return pushTokenString;
  } catch (e: unknown) {
    handleRegistrationError('${e}');
  }
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  useEffect(() => {
    registerForPushNotificationsAsync()
    .then(token => setExpoPushToken(token ?? ''))
    .catch((error: any) => setExpoPushToken('${error}'));

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return React.createElement(
    View,
    { style: { flex: 1, alignItems: 'center', justifyContent: 'space-around' } },
    React.createElement(Text, null, `Your Expo push token: ${expoPushToken}`),
    React.createElement(
      View,
      { style: { alignItems: 'center', justifyContent: 'center' } },
      React.createElement(Text, null, `Title: ${notification && notification.request.content.title} `),
      React.createElement(Text, null, `Body: ${notification && notification.request.content.body}`),
      React.createElement(Text, null, `Data: ${notification && JSON.stringify(notification.request.content.data)}`)
    ),
    React.createElement(Button, {
      title: 'Press to Send Notificaion',
      onPress: async () => {
        await sendPushNotification(expoPushToken);
      },
    })
  );
}
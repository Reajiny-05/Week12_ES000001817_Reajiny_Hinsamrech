import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import React, { useEffect, useState } from 'react'
import { Button, Platform, Text, View } from 'react-native'

import { Provider, useSelector } from 'react-redux'
import { addFailure, addSuccess, resetStatus } from '../src/firebaseStatus.slice'
import { useAppDispatch } from '../src/hooks'
import { RootState, store } from '../src/store'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function sendPushNotification(
  expoPushToken: string,
  success: number,
  failure: number
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Firebase Process Finished',
    body: `${success} successful, ${failure} unsuccessful.`,
    data: {
      success,
      failure,
    },
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    throw new Error('Failed to send notification')
  }

  return await response.json()
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage)
  throw new Error(errorMessage)
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()

    if (status !== 'granted') {
      handleRegistrationError(
        'Permission not granted to get push token for push notification!'
      )
      return
    }
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId

  if (!projectId) {
    handleRegistrationError('Project ID not found')
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data

    console.log(pushTokenString)
    return pushTokenString
  } catch (e: unknown) {
    handleRegistrationError(`${e}`)
  }
}

function MainApp() {
  const [expoPushToken, setExpoPushToken] = useState('')
  const [notification, setNotification] =
    useState<Notifications.Notification | undefined>()

  const dispatch = useAppDispatch()

  const success = useSelector(
    (state: RootState) => state.firebaseStatus.success
  )

  const failure = useSelector(
    (state: RootState) => state.firebaseStatus.failure
  )

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ''))
      .catch((error: any) => setExpoPushToken(`${error}`))

    const notificationListener =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification)
      })

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response)
      })

    return () => {
      notificationListener.remove()
      responseListener.remove()
    }
  }, [])

  const handleSendNotification = async () => {
    try {
      const nextSuccess = success + 1

      await sendPushNotification(expoPushToken, nextSuccess, failure)

      dispatch(addSuccess())
    } catch (error) {
      const nextFailure = failure + 1

      dispatch(addFailure())

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Firebase Process Finished',
          body: `${success} successful, ${nextFailure} unsuccessful.`,
          data: {
            success,
            failure: nextFailure,
          },
        },
        trigger: null,
      })
    }
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 20,
      }}
    >
      <Text>Your Expo push token: {expoPushToken}</Text>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Successful: {success}</Text>
        <Text>Unsuccessful: {failure}</Text>
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification?.request.content.title}</Text>
        <Text>Body: {notification?.request.content.body}</Text>
        <Text>Data: {JSON.stringify(notification?.request.content.data)}</Text>
      </View>

      <Button
        title="Send Firebase Notification"
        onPress={handleSendNotification}
      />

      <Button
        title="Reset Counter"
        onPress={() => dispatch(resetStatus())}
      />
    </View>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  )
}
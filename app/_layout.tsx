import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect } from "react";
import React from "react";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";

import { StatusBar } from "react-native";
import { BLEProvider } from "@/store/BLE-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // useEffect(() => {
  //   if (loaded) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <ActionSheetProvider>
        <BLEProvider>
          <Stack>
            {/* <Stack.Screen name="main" options={{headerShown: false}} /> */}
            <Stack.Screen name="index" options={{ headerShown: false }} />

            {/* <Stack.Screen name="explore" options={{ title: 'Explore Screen' }} /> */}
            <Stack.Screen name="+not-found" />
          </Stack>
        </BLEProvider>
      </ActionSheetProvider>
    </>
  );
}

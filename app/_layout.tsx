import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext"; // Import useAuth

// This is the main layout component
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.log('Layout useEffect triggered - user:', user ? user.email : 'null', 'isLoading:', isLoading, 'pathname:', pathname);
    if (isLoading) return;

    if (!user && pathname !== '/login') {
      console.log('Redirecting to login');
      router.replace('/login');
    } else if (user && pathname === '/login') {
      console.log('Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, isLoading, pathname]);

  // Show a loading spinner while we check for a user
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      {/* The login screen is now outside the main app flow */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      {/* The main app screens */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(organizer)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

// This is the root component that wraps everything
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // The AuthProvider must be at the very top to provide context to all routes
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
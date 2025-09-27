import { Tabs } from 'expo-router';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Colors = {
  primaryRed: "#B80000",
  accentNavy: "#0D2A4C",
  subtleText: "#5A5A5A",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryRed,
        tabBarInactiveTintColor: Colors.subtleText,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Events Map',
          tabBarIcon: ({ color }) => <Icon name="map-marker" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Icon name="compass" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
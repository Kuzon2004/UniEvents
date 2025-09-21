import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location'; // For location permissions
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For marker icons
import { TextInput } from 'react-native';


// --- Color Palette (from Scholarly & Focused) ---
const Colors = {
  primaryRed: '#B80000',
  accentNavy: '#0D2A4C',
  darkText: '#212529',
  subtleText: '#5A5A5A',
  background: '#FFFFFF',
  border: '#DEE2E6',
};

// --- Dummy Event Data ---
const dummyEvents = [
  {
    id: '1',
    title: 'Welcome Fair',
    organizer: 'Student Life',
    description: 'Meet student organizations and enjoy free food!',
    time: '2023-10-26T10:00:00Z',
    location: { latitude: 34.0201, longitude: -118.2856 }, // Example: USC main campus area
    type: 'social',
  },
  {
    id: '2',
    title: 'Lecture: AI Ethics',
    organizer: 'Computer Science Dept.',
    description: 'Discussion on the ethical implications of artificial intelligence.',
    time: '2023-10-27T14:30:00Z',
    location: { latitude: 34.0225, longitude: -118.2850 },
    type: 'academic',
  },
  {
    id: '3',
    title: 'Basketball Game',
    organizer: 'Athletics',
    description: 'Come support our team against rival university!',
    time: '2023-10-26T19:00:00Z',
    location: { latitude: 34.0190, longitude: -118.2830 },
    type: 'sports',
  },
  {
    id: '4',
    title: 'Study Session',
    organizer: 'Library',
    description: 'Quiet study area available for finals prep.',
    time: '2023-10-28T09:00:00Z',
    location: { latitude: 34.0200, longitude: -118.2880 },
    type: 'academic',
  },
  {
    id: '5',
    title: 'Art Exhibit Opening',
    organizer: 'Fine Arts Dept.',
    description: 'New student art exhibition featuring various mediums.',
    time: '2023-10-27T17:00:00Z',
    location: { latitude: 34.0210, longitude: -118.2870 },
    type: 'cultural',
  },
];

// Helper to get icon name based on event type
const getEventTypeIcon = (type:string) => {
  switch (type) {
    case 'social': return 'account-group'; // People icon
    case 'academic': return 'book-open-page-variant'; // Book icon
    case 'sports': return 'basketball'; // Basketball icon
    case 'cultural': return 'palette'; // Palette icon
    default: return 'map-marker'; // Generic marker
  }
};

const MapScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Default region for initial map view (e.g., center of a university)
  const initialRegion = {
    latitude: 34.0207, // Example: University of Southern California (USC) central point
    longitude: -118.2856,
    latitudeDelta: 0.015,
    longitudeDelta: 0.012,
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission to access location was denied',
          'Please enable location services in your device settings to see your current location on the map.'
        );
        setLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      setLoadingLocation(false);

      // Animate map to user's location if available
      if (mapRef.current && location.coords) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005, // Zoom in closer
          longitudeDelta: 0.005, // Zoom in closer
        }, 1000); // Animation duration in milliseconds
      }
    })();
  }, []);

  const handleMarkerPress = (event: typeof dummyEvents[0]) => {
    console.log('Marker Pressed:', event.title);
    // In a real app, this would trigger the bottom sheet to slide up
    Alert.alert(
      event.title,
      `${event.description}\n\nOrganizer: ${event.organizer}\nTime: ${new Date(event.time).toLocaleString()}`,
      [{ text: 'OK' }]
    );
  };

  if (loadingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryRed} />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT} // Use Google Maps on Android for consistency
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true} // Show a dot for the user's current location
        followsUserLocation={true}
        showsMyLocationButton={false} // We'll create a custom one if needed
        onPress={() => console.log('Map tapped')} // Can be used to dismiss bottom sheets
      >
        {/* Render Markers for Events */}
        {dummyEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.location}
            onPress={() => handleMarkerPress(event)}
            // title={event.title} // Optionally show a default tooltip on tap
            // description={event.description}
          >
            <View style={styles.markerContainer}>
              <View style={[
                  styles.markerPin,
                  event.type === 'academic' || event.type === 'cultural'
                    ? { backgroundColor: Colors.accentNavy } // Navy for academic/cultural
                    : { backgroundColor: Colors.primaryRed } // Red for social/sports
              ]}>
                <Icon
                  name={getEventTypeIcon(event.type)}
                  size={20}
                  color={Colors.background} // White icon
                />
              </View>
              <View style={styles.markerPointer} />
            </View>
          </Marker>
        ))}

        {/* Optional: User's actual location if you want a custom marker */}
        {/* {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="You Are Here"
            pinColor="blue" // You can customize this further
          />
        )} */}
      </MapView>

      {/* --- Overlay UI Elements (Search Bar, Filter Button, FAB for Organizer) --- */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={24} color={Colors.subtleText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find events, buildings..."
            placeholderTextColor={Colors.subtleText}
          />
          <TouchableOpacity onPress={() => console.log('Filter pressed')} style={styles.filterButton}>
            <Icon name="tune" size={24} color={Colors.accentNavy} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Action Button (FAB) for adding events */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => console.log('Add new event')}
      >
        <Icon name="plus" size={30} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.darkText,
  },
  map: {
    flex: 1,
  },
  // --- Custom Marker Styles ---
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20, // Makes it circular
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background, // White border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerPointer: {
    width: 10,
    height: 10,
    backgroundColor: 'transparent',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primaryRed, // This color will be covered by the dynamic pin color
    position: 'absolute',
    bottom: -10, // Position it below the circle
    transform: [{ translateY: 5 }, { rotate: '180deg' }], // Rotate to point down
  },
  // You might want to adjust markerPointer's color dynamically too
  // based on the markerPin's background for consistency.

  // --- Overlay UI Styles (from UIZARD prompt) ---
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20, // Adjust for notch/status bar
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1, // Ensure it's above the map
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    paddingVertical: 0, // Reset default padding
  },
  filterButton: {
    marginLeft: 10,
    padding: 5,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 70, // Adjust for bottom navigation bar height
    right: 25,
    backgroundColor: Colors.primaryRed,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1,
  },
});

export default MapScreen;
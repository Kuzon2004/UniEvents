import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  TextInput, // Added TextInput for the search bar
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Color Palette (from Scholarly & Focused) ---
const Colors = {
  primaryRed: '#B80000',
  accentNavy: '#0D2A4C',
  darkText: '#212529',
  subtleText: '#5A5A5A',
  background: '#FFFFFF',
  border: '#DEE2E6',
};

// --- Anna University, Chennai Specific Coordinates ---
const ANNA_UNIVERSITY_CENTER = {
  latitude: 13.0163,  // Approximate center of Anna University, Chennai
  longitude: 80.2038,
};

// --- Dummy Event Data (Updated for Anna University context) ---
const dummyEvents = [
  {
    id: '1',
    title: 'Freshers Welcome',
    organizer: 'Student Affairs',
    description: 'A grand welcome for all new students!',
    time: '2023-10-26T10:00:00Z',
    location: { latitude: 13.0180, longitude: 80.2030 }, // Near Main Building
    type: 'social',
  },
  {
    id: '2',
    title: 'Lecture: Adv. ML',
    organizer: 'CSE Department',
    description: 'Advanced Machine Learning concepts.',
    time: '2023-10-27T14:30:00Z',
    location: { latitude: 13.0160, longitude: 80.2045 }, // Near Computer Science Block
    type: 'academic',
  },
  {
    id: '3',
    title: 'Football Match',
    organizer: 'Sports Club',
    description: 'Inter-departmental football tournament.',
    time: '2023-10-26T19:00:00Z',
    location: { latitude: 13.0145, longitude: 80.2020 }, // Near Sports Ground
    type: 'sports',
  },
  {
    id: '4',
    title: 'Library Orientation',
    organizer: 'Central Library',
    description: 'Learn how to effectively use the university library resources.',
    time: '2023-10-28T09:00:00Z',
    location: { latitude: 13.0170, longitude: 80.2025 }, // Near Central Library
    type: 'academic',
  },
  {
    id: '5',
    title: 'Cultural Fest Prep',
    organizer: 'Fine Arts Club',
    description: 'Meeting for preparations for the upcoming cultural fest.',
    time: '2023-10-27T17:00:00Z',
    location: { latitude: 13.0155, longitude: 80.2035 }, // Near Auditorium/Cultural Hall
    type: 'cultural',
  },
];

// Helper to get icon name based on event type
const getEventTypeIcon = (type) => {
  switch (type) {
    case 'social': return 'account-group'; // People icon
    case 'academic': return 'book-open-page-variant'; // Book icon
    case 'sports': return 'soccer'; // Changed to soccer for relevance
    case 'cultural': return 'palette'; // Palette icon
    default: return 'map-marker'; // Generic marker
  }
};

const MapScreen = () => {
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Initial region focused on Anna University
  const initialRegion = {
    latitude: ANNA_UNIVERSITY_CENTER.latitude,
    longitude: ANNA_UNIVERSITY_CENTER.longitude,
    latitudeDelta: 0.008, // Zoom level: smaller delta = more zoomed in
    longitudeDelta: 0.006,
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to see your position relative to campus events.'
        );
        setLoadingLocation(false);
        // Optionally, you could still animate to campus center here if permission is denied
        // mapRef.current?.animateToRegion(initialRegion, 1000);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      setLoadingLocation(false);

      // Animate map to user's location if available, ensuring it's still within campus bounds
      if (mapRef.current && location.coords) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.003, // Zoom in closer on user
          longitudeDelta: 0.003,
        }, 1000);
      }
    })();
  }, []);

  const handleMarkerPress = (event) => {
    console.log('Marker Pressed:', event.title);
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
        <Text style={styles.loadingText}>Fetching your location for campus map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true} // Show user's blue dot
        showsMyLocationButton={false} // Hide default button
        followsUserLocation={false} // Don't constantly re-center on user
        minZoomLevel={15} // Restrict zooming out too far (adjust as needed for campus size)
        maxZoomLevel={20} // Restrict zooming in too far
        // Optional: restrict panning to a bounding box (more advanced)
        // camera={{ // This property can be used for more fine-grained control
        //   center: ANNA_UNIVERSITY_CENTER,
        //   pitch: 0,
        //   heading: 0,
        //   altitude: 0,
        //   zoom: 16,
        // }}
      >
        {/* Render Markers for Events */}
        {dummyEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.location}
            onPress={() => handleMarkerPress(event)}
          >
            <View style={styles.markerContainer}>
              <View style={[
                  styles.markerPin,
                  event.type === 'academic' || event.type === 'cultural'
                    ? { backgroundColor: Colors.accentNavy }
                    : { backgroundColor: Colors.primaryRed }
              ]}>
                <Icon
                  name={getEventTypeIcon(event.type)}
                  size={20}
                  color={Colors.background}
                />
              </View>
              {/* This markerPointer style could also be made dynamic to match the pin color */}
              <View style={[
                  styles.markerPointer,
                  event.type === 'academic' || event.type === 'cultural'
                    ? { borderTopColor: Colors.accentNavy }
                    : { borderTopColor: Colors.primaryRed }
              ]} />
            </View>
          </Marker>
        ))}
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
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
    borderTopColor: Colors.primaryRed, // This will be overridden dynamically
    position: 'absolute',
    bottom: -10,
    transform: [{ translateY: 5 }, { rotate: '180deg' }],
  },
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
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
    paddingVertical: 0,
  },
  filterButton: {
    marginLeft: 10,
    padding: 5,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 70,
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
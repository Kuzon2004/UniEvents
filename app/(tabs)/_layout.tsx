import React, { useRef } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// --- Color Palette ---
const Colors = {
  primaryRed: "#B80000",
  accentNavy: "#0D2A4C",
  darkText: "#212529",
  subtleText: "#5A5A5A",
  background: "#FFFFFF",
  border: "#DEE2E6",
};

// --- Anna University Bounds ---
const ANNA_UNIVERSITY_BOUNDS = {
  minLat: 13.007222,
  maxLat: 13.015944,
  minLon: 80.230278,
  maxLon: 80.240351,
};

// Compute center + deltas
const ANNA_UNIVERSITY_CENTER = {
  latitude: (ANNA_UNIVERSITY_BOUNDS.minLat + ANNA_UNIVERSITY_BOUNDS.maxLat) / 2,
  longitude:
    (ANNA_UNIVERSITY_BOUNDS.minLon + ANNA_UNIVERSITY_BOUNDS.maxLon) / 2,
};

const initialLatitudeDelta =
  ANNA_UNIVERSITY_BOUNDS.maxLat - ANNA_UNIVERSITY_BOUNDS.minLat;
const initialLongitudeDelta =
  ANNA_UNIVERSITY_BOUNDS.maxLon - ANNA_UNIVERSITY_BOUNDS.minLon;

// --- Dummy Event Data ---
const dummyEvents = [
  {
    id: "1",
    title: "Lecture: Adv. ML",
    organizer: "CSE Department",
    description: "Advanced Machine Learning concepts.",
    time: "2023-10-27T14:30:00Z",
    location: { latitude: 13.0125, longitude: 80.236 }, // CSE Block
    type: "academic",
  },
  {
    id: "2",
    title: "Football Match",
    organizer: "Sports Club",
    description: "Inter-departmental football tournament.",
    time: "2023-10-26T19:00:00Z",
    location: { latitude: 13.0142, longitude: 80.2325 }, // Sports Ground
    type: "sports",
  },
  {
    id: "3",
    title: "Library Orientation",
    organizer: "Central Library",
    description: "Learn how to effectively use the library.",
    time: "2023-10-28T09:00:00Z",
    location: { latitude: 13.0138, longitude: 80.238 }, // Library
    type: "academic",
  },
];

// Helper to get icon
const getEventTypeIcon = (type: string) => {
  switch (type) {
    case "social":
      return "account-group";
    case "academic":
      return "book-open-page-variant";
    case "sports":
      return "soccer";
    case "cultural":
      return "palette";
    default:
      return "map-marker";
  }
};

const MapScreen = () => {
  const mapRef = useRef(null);

  const initialRegion = {
    latitude: ANNA_UNIVERSITY_CENTER.latitude,
    longitude: ANNA_UNIVERSITY_CENTER.longitude,
    latitudeDelta: initialLatitudeDelta * 1.2, // buffer
    longitudeDelta: initialLongitudeDelta * 1.2,
  };

  const handleMarkerPress = (event: typeof dummyEvents[number]) => {
    Alert.alert(
      event.title,
      `${event.description}\n\nOrganizer: ${event.organizer}\nTime: ${new Date(
        event.time
      ).toLocaleString()}`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        style={styles.map}
        initialRegion={initialRegion}
        minZoomLevel={15}
        maxZoomLevel={20}
        // scrollEnabled={false}   // disable moving
        // rotateEnabled={false}   // disable rotation
        // pitchEnabled={false}    // disable tilt
        // zoomEnabled={true}      // allow zoom only
      >
        {dummyEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.location}
            onPress={() => handleMarkerPress(event)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.markerPin,
                  event.type === "academic" || event.type === "cultural"
                    ? { backgroundColor: Colors.accentNavy }
                    : { backgroundColor: Colors.primaryRed },
                ]}
              >
                <Icon
                  name={getEventTypeIcon(event.type)}
                  size={20}
                  color={Colors.background}
                />
              </View>
              <View
                style={[
                  styles.markerPointer,
                  event.type === "academic" || event.type === "cultural"
                    ? { borderTopColor: Colors.accentNavy }
                    : { borderTopColor: Colors.primaryRed },
                ]}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Icon
            name="magnify"
            size={24}
            color={Colors.subtleText}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Find events, buildings..."
            placeholderTextColor={Colors.subtleText}
          />
          <TouchableOpacity
            onPress={() => console.log("Filter pressed")}
            style={styles.filterButton}
          >
            <Icon name="tune" size={24} color={Colors.accentNavy} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => console.log("Add new event")}
      >
        <Icon name="plus" size={30} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerContainer: { alignItems: "center", justifyContent: "center" },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerPointer: {
    width: 10,
    height: 10,
    backgroundColor: "transparent",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primaryRed,
    position: "absolute",
    bottom: -10,
    transform: [{ translateY: 5 }, { rotate: "180deg" }],
  },
  searchBarContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    paddingVertical: 0,
  },
  filterButton: { marginLeft: 10, padding: 5 },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 70,
    right: 25,
    backgroundColor: Colors.primaryRed,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1,
  },
});

export default MapScreen;

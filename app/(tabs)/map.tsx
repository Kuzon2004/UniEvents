import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  GeoPoint,
  getDoc,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { auth, db } from "../../firebaseConfig";

const Colors = {
  primaryRed: "#B80000",
  accentNavy: "#0D2A4C",
  background: "#FFFFFF",
  darkText: "#212529",
  subtleText: "#5A5A5A",
  border: "#DEE2E6",
};

interface Event {
  id: string;
  eventName: string;
  description: string;
  category: string;
  dateTime?: Timestamp;
  venueDetails: { building: string; floor: string; room: string };
  organizerInfo: { name: string; phoneNumber: string };
  imageUrls: string[];
  location?: GeoPoint;
  createdBy?: string;
}

const MapScreen = () => {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectingLocation, setSelectingLocation] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const mapRef = useRef<MapView>(null);

  const minLat = 13.006;
  const maxLat = 13.018;
  const minLng = 80.230;
  const maxLng = 80.244;

  useEffect(() => {
    const eventsCollection = collection(db, "events");
    const unsubscribe = onSnapshot(
      eventsCollection,
      (snapshot) => {
        const eventsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];
        setEvents(eventsList);
      },
      (error) => {
        console.error("Failed to fetch data:", error);
        Alert.alert("Error", "Could not load data from the server.");
      }
    );

    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserRole(userDoc.data().role);
      }
    };
    fetchUserRole();

    setLoading(false);

    return () => unsubscribe();
  }, []);

  const handleMarkerPress = (event: Event) => {
    if (selectingLocation) return;
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleMapPress = (e: any) => {
    if (selectingLocation) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setSelectingLocation(false);
      router.push(`/(organizer)/createEvent?lat=${latitude}&lng=${longitude}`);
    }
  };

  const handleFabPress = () => setSelectingLocation(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "events", eventId));
              setEvents(prev => prev.filter(e => e.id !== eventId));
              setModalVisible(false);
              Alert.alert("Success", "Event deleted successfully.");
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Could not delete the event.");
            }
          },
        },
      ]
    );
  };

  const toggle3D = () => {
    const newPitch = is3D ? 0 : 45;
    setIs3D(prev => !prev);
    if (mapRef.current) {
      mapRef.current.animateCamera({ pitch: newPitch }, { duration: 1000 });
    }
  };

  const handleRegionChangeComplete = (region: any) => {
    if (region.latitude < minLat || region.latitude > maxLat || region.longitude < minLng || region.longitude > maxLng) {
      const zoom = Math.log2(360 / region.latitudeDelta);
      mapRef.current?.animateCamera({
        center: { latitude: 13.0122935, longitude: 80.2372295 },
        zoom,
        pitch: is3D ? 45 : 0,
        heading: 0,
      });
    }
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primaryRed} />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
     <MapView
  ref={mapRef}
  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
  style={styles.map}
  initialRegion={{
    latitude: 13.0136,
    longitude: 80.2345,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  }}
  minZoomLevel={17.5}
  onPress={handleMapPress}
  onRegionChangeComplete={handleRegionChangeComplete}
>
  {events
    .filter(event => event.location)
    .map(event => {
      let iconName = 'map-marker';
      let iconColor = Colors.primaryRed;
      if (event.category === 'Tech') {
        iconName = 'laptop';
        iconColor = '#d30000ff';
      } else if (event.category === 'Food') {
        iconName = 'food';
        iconColor = '#dc0000ff';
      }
      return (
        <Marker
          key={event.id}
          coordinate={{
            latitude: event.location!.latitude,
            longitude: event.location!.longitude,
          }}
          anchor={{ x: 0.5, y: 1 }}
          onPress={() => handleMarkerPress(event)} // opens modal
        >
          {/* Marker icon only, no text above */}
          <Icon name={iconName} size={30} color={iconColor} />
        </Marker>
      );
    })}
</MapView>



      {selectingLocation && (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.overlayContent} pointerEvents="auto">
            <Text style={styles.overlayText}>Tap on the map to select event location</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectingLocation(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color={Colors.accentNavy} />
      </TouchableOpacity>

      {userRole === "organizer" && (
        <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
          <Icon name="plus" size={30} color={Colors.background} />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.toggle3DBtn} onPress={toggle3D}>
        <Icon name={is3D ? "earth" : "map"} size={24} color={Colors.accentNavy} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Icon name="close" size={24} color={Colors.accentNavy} />
          </TouchableOpacity>
          {selectedEvent && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedEvent.eventName}</Text>
              <Text style={styles.modalDateTime}>
                {selectedEvent.dateTime
                  ? selectedEvent.dateTime.toDate().toLocaleString()
                  : "Date not specified"}
              </Text>

              {selectedEvent.imageUrls?.map((url, idx) => (
                <Image
                  key={`${selectedEvent.id}-${idx}`}
                  source={{ uri: url }}
                  style={styles.eventImage}
                />
              ))}

              <Text style={styles.modalDescription}>{selectedEvent.description}</Text>

              <View style={styles.modalInfoBox}>
                <Text style={styles.modalLabel}>Venue</Text>
                <Text style={styles.modalText}>Building: {selectedEvent.venueDetails.building}</Text>
                <Text style={styles.modalText}>Floor: {selectedEvent.venueDetails.floor}</Text>
                <Text style={styles.modalText}>Room number: {selectedEvent.venueDetails.room}</Text>
              </View>
              <View style={styles.modalInfoBox}>
                <Text style={styles.modalLabel}>Organizer</Text>
                <Text style={styles.modalText}>Organizer name: {selectedEvent.organizerInfo.name}</Text>
                <Text style={styles.modalText}>Organizer contact: {selectedEvent.organizerInfo.phoneNumber}</Text>
              </View>

              {userRole === "organizer" &&
                selectedEvent.createdBy === auth.currentUser?.uid && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete Event</Text>
                  </TouchableOpacity>
                )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  calloutContainer: {
  backgroundColor: "white",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  borderWidth: 1,
  borderColor: Colors.primaryRed,
},
calloutText: {
  fontSize: 12,
  fontWeight: "bold",
  color: Colors.darkText,
},

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoutButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: Colors.primaryRed,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  toggle3DBtn: {
    position: "absolute",
    bottom: 30,
    left: 30,
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayContent: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  
  overlayText: { fontSize: 18, color: Colors.background, textAlign: "center", marginBottom: 20 },
  cancelButton: { backgroundColor: Colors.primaryRed, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  cancelButtonText: { color: Colors.background, fontSize: 16, fontWeight: "bold" },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  closeButton: { position: "absolute", top: 20, right: 20, zIndex: 1 },
  modalContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: Colors.darkText, marginBottom: 5 },
  modalDateTime: { fontSize: 14, color: Colors.subtleText, marginBottom: 15 },
  modalDescription: { fontSize: 16, color: Colors.darkText, lineHeight: 24, marginBottom: 20 },
  modalInfoBox: { backgroundColor: "#F0F2F5", padding: 15, borderRadius: 10, marginBottom: 10 },
  modalLabel: { fontSize: 14, fontWeight: "600", color: Colors.subtleText, marginBottom: 3 },
  modalText: { fontSize: 16, color: Colors.darkText },
  deleteButton: { backgroundColor: Colors.primaryRed, padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  deleteButtonText: { color: Colors.background, fontSize: 16, fontWeight: "bold" },
  markerWrapper: { alignItems: "center" },
  markerLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.darkText,
    backgroundColor: "white",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  eventImage: { width: 250, height: 150, borderRadius: 10, marginBottom: 10, backgroundColor: Colors.border },
});

export default MapScreen;

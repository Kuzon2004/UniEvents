import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  GeoPoint,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  where
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

import { useAuth } from '../../context/AuthContext';
import { auth, db } from "../../firebaseConfig";
import { useNotificationScheduler } from '../../hooks/useNotificationScheduler';

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
  const { user, role: userRole } = useAuth();
  const { scheduleNotification } = useNotificationScheduler();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const [selectingLocation, setSelectingLocation] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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

    setLoading(false);

    return () => unsubscribe();
  }, [refreshKey]);

  const handleMarkerPress = async (event: Event) => {
    if (selectingLocation) return;
    setSelectedEvent(event);
    setModalVisible(true);

    if (!user) {
      setIsRegistered(false);
      return;
    }

    try {
      const registeredQuery = query(
        collection(db, "registeredEvents"),
        where("userId", "==", user.uid),
        where("eventId", "==", event.id)
      );
      const snapshot = await getDocs(registeredQuery);
      setIsRegistered(!snapshot.empty);
    } catch (error) {
      console.error("Error checking registration on marker press:", error);
      setIsRegistered(false);
    }
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

  const handleRegisterFromMarker = async () => {
    if (!selectedEvent || !user) return;

    try {
      // Check if already registered
      const registeredQuery = query(
        collection(db, "registeredEvents"),
        where("userId", "==", user.uid),
        where("eventId", "==", selectedEvent.id)
      );
      const snapshot = await getDocs(registeredQuery);
      if (!snapshot.empty) {
        Alert.alert("Info", "You are already registered for this event.");
        return;
      }

      // Fetch user details
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, "registeredEvents"), {
        userId: user.uid,
        eventId: selectedEvent.id,
        registeredAt: Timestamp.now(),
        name: userData?.displayName || userData?.email || 'Name',
        email: user?.email || '',
      });

      Alert.alert("Success", "You have successfully registered for this event!");
      setModalVisible(false);

      // Schedule notification
      await scheduleNotification(selectedEvent as any);
    } catch (error) {
      console.error("Error registering from marker:", error);
      Alert.alert("Error", "Failed to register for the event. Please try again.");
    }
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
                <Icon name={iconName} size={35} color={iconColor} />
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

      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => setRefreshKey(prev => prev + 1)} style={styles.reloadButton}>
          <Icon name="refresh" size={24} color={Colors.accentNavy} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color={Colors.accentNavy} />
        </TouchableOpacity>
      </View>

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

              {userRole === "student" && !isRegistered && (
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegisterFromMarker}
                >
                  <Text style={styles.registerButtonText}>Register for Event</Text>
                </TouchableOpacity>
              )}

              {userRole === "student" && isRegistered && (
                <View style={styles.registeredContainer}>
                  <Text style={styles.registeredText}>You are registered for this event</Text>
                </View>
              )}

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
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRight: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reloadButton: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    marginRight: 10,
  },
  logoutButton: {
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
  registerButton: { backgroundColor: Colors.primaryRed, padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  registerButtonText: { color: Colors.background, fontSize: 16, fontWeight: "bold" },
  deleteButton: { backgroundColor: Colors.primaryRed, padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  deleteButtonText: { color: Colors.background, fontSize: 16, fontWeight: "bold" },
  registeredContainer: { backgroundColor: "#E9F7EF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  registeredText: { color: "#28A745", fontSize: 16, fontWeight: "bold" },
  eventImage: { width: 250, height: 150, borderRadius: 10, marginBottom: 10, backgroundColor: Colors.border },
});

export default MapScreen;

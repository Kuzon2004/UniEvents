import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { addDoc, collection, doc, GeoPoint, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { auth, db } from "../../firebaseConfig";

const Colors = {
  primaryRed: "#B80000",
  accentNavy: "#0D2A4C",
  background: "#FFFFFF",
  darkText: "#212529",
  border: "#DEE2E6",
};

// --- Anna University Bounds (from your original code) ---
const ANNA_UNIVERSITY_BOUNDS = {
  minLat: 13.007222,
  maxLat: 13.015944,
  minLon: 80.230278,
  maxLon: 80.240351,
};

const MapScreen = () => {
   const initialRegion = {
    latitude: 13.0136,
    longitude: 80.2345,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };
  
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [addEventMode, setAddEventMode] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(initialRegion);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [mapPitch, setMapPitch] = useState(0); // 0 is 2D, 45 is 3D
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventCoordinate, setNewEventCoordinate] = useState<any>(null);

  const mapRef = useRef<MapView>(null);
  const isTogglingView = useRef(false);

const toggleMapView = () => {
  const newPitch = mapPitch === 0 ? 45 : 0;
  setMapPitch(newPitch);

  mapRef.current?.animateCamera({
    pitch: newPitch,
  }, { duration: 750 });
};

  const fetchData = async () => {
    try {
      const eventsCollection = collection(db, "events");
      const eventSnapshot = await getDocs(eventsCollection);
      const eventsList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsList);

      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      Alert.alert("Error", "Could not load data from the server.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMapPress = (e: any) => {
    if (!addEventMode) return;
    const coordinate = e.nativeEvent.coordinate;
    setNewEventCoordinate(coordinate);
    setModalVisible(true);
    setAddEventMode(false);
  };
  
  const handleFabPress = () => {
    setAddEventMode(true);
    Alert.alert("Add Event Mode", "Tap anywhere on the map to place your new event.");
  };

  const handleSaveEvent = async () => {
    if (!newEventTitle || !newEventCoordinate) {
      Alert.alert("Error", "Please enter a title for the event.");
      return;
    }
    try {
      await addDoc(collection(db, "events"), {
        title: newEventTitle,
        description: newEventDescription,
        location: new GeoPoint(newEventCoordinate.latitude, newEventCoordinate.longitude),
        createdAt: new Date(),
        organizerId: auth.currentUser?.uid,
      });
      setModalVisible(false);
      setNewEventTitle("");
      setNewEventDescription("");
      fetchData();
    } catch (error) {
      console.error("Error saving event: ", error);
      Alert.alert("Error", "Could not save the event.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

 
  
 const handleRegionChangeComplete = (region: Region) => {
  if (isTogglingView.current) {
    isTogglingView.current = false;
    return;
  }

  let needsCorrection = false;
  if (
    region.latitude < ANNA_UNIVERSITY_BOUNDS.minLat ||
    region.latitude > ANNA_UNIVERSITY_BOUNDS.maxLat ||
    region.longitude < ANNA_UNIVERSITY_BOUNDS.minLon ||
    region.longitude > ANNA_UNIVERSITY_BOUNDS.maxLon
  ) {
    needsCorrection = true;
  }

  if (needsCorrection) {
    mapRef.current?.animateToRegion(initialRegion, 500);
    // When correcting, also reset the state to the initial region
    setCurrentRegion(initialRegion);
    
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  } else {
    // If the new position is valid, update our state
    setCurrentRegion(region);
  }
};




  return (
    <SafeAreaView style={styles.container}>
<MapView
  ref={mapRef}
  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
  style={styles.map}
  onPress={handleMapPress}
  minZoomLevel={15}
  onRegionChangeComplete={handleRegionChangeComplete}
  pitchEnabled={false}
>
       {events.map((event) => {
  // Add this check to ensure the event has a location before rendering the Marker
  if (!event.location || event.location.latitude === undefined) {
   
  }
  
  return (
    <Marker
      key={event.id}
      coordinate={{ latitude: event.location.latitude, longitude: event.location.longitude }}
      title={event.title}
      description={event.description}
    >
      <Icon name="map-marker" size={40} color={Colors.primaryRed} />
    </Marker>
  );
})}
      </MapView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Add New Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Title"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Event Description"
              value={newEventDescription}
              onChangeText={setNewEventDescription}
              multiline
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveEvent}
              >
                <Text style={styles.textStyle}>Save Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        <TouchableOpacity style={styles.viewToggleButton} onPress={toggleMapView}>
  <Icon name={mapPitch === 0 ? "cube-outline" : "map-outline"} size={24} color={Colors.accentNavy} />
</TouchableOpacity>

<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
  {/* ... logout icon ... */}
</TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color={Colors.accentNavy} />
      </TouchableOpacity>
      
      {userRole === 'organizer' && (
        <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
          <Icon name="plus" size={30} color={Colors.background} />
        </TouchableOpacity>
      )}

      {addEventMode && (
        <View style={styles.addModeBanner}>
          <Text style={styles.addModeText}>Add Mode: Tap on the map to place your event.</Text>
        </View>
      )}
      {toastVisible && (
  <View style={styles.toastContainer}>
    <Text style={styles.toastText}>Events Only in Anna University</Text>
  </View>
)}
    </SafeAreaView>
  );
};





const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  logoutButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 30,
    elevation: 5,
  },
  viewToggleButton: {
  position: 'absolute',
  top: Platform.OS === 'ios' ? 60 : 40,
  right: 80, // Position it to the left of the logout button
  backgroundColor: Colors.background,
  padding: 10,
  borderRadius: 30,
  elevation: 5,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 5,
},
  toastContainer: {
  position: 'absolute',
  top: 60,
  alignSelf: 'center',
  backgroundColor: 'rgba(0,0,0,0.7)',
  borderRadius: 20,
  paddingVertical: 10,
  paddingHorizontal: 20,
  elevation: 10,
},
toastText: {
  color: 'white',
  fontSize: 14,
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
  addModeBanner: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    alignItems: 'center',
  },
  addModeText: { color: 'white', fontWeight: 'bold' },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalText: { marginBottom: 15, textAlign: "center", fontSize: 20, fontWeight: 'bold' },
  input: {
    width: '100%',
    backgroundColor: '#F0F2F5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  button: { borderRadius: 10, padding: 10, elevation: 2, flex: 0.48, alignItems: 'center' },
  buttonClose: { backgroundColor: '#6C757D' },
  buttonSave: { backgroundColor: Colors.primaryRed },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" },
});

export default MapScreen;
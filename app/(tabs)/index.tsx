import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// --- Import the new Auth hook and Firebase config ---
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../firebaseConfig';
import { useNotificationScheduler } from 'D:/Projects/Programs/App-uni/UniEvents/app/hooks/useNotificationScheduler.ts';

interface Event {
  id: string;
  eventName: string;
  description: string;
  category: string;
  dateTime?: Timestamp;
  venueDetails: { building: string; floor: string; room: string };
  organizerInfo: { name: string; phoneNumber: string };
  imageUrls: string[];
  createdBy?: string;
}

const Colors = {
  primaryRed: "#B80000",
  darkText: "#212529",
  subtleText: '#6C757D',
  border: '#DEE2E6',
  background: "#FFFFFF",
};

export default function HomeScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { scheduleNotification, registerForPushNotificationsAsync } = useNotificationScheduler();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (isLoading || !user) return;

    const eventsCollection = collection(db, "events");
    const unsubscribe = onSnapshot(
      eventsCollection,
      (snapshot) => {
        const eventsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsList);
      },
      (error) => {
        console.error("Error fetching events for home screen: ", error);
      }
    );

    const fetchUserRole = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setUserRole(userDoc.data().role);
    };
    fetchUserRole();

    // Request notification permissions
    registerForPushNotificationsAsync();

    return () => unsubscribe();
  }, [user, isLoading, registerForPushNotificationsAsync]);

  // Check if user is registered for selected event
  useEffect(() => {
    if (!selectedEvent || !user) return;

    const checkRegistration = async () => {
      try {
        const registeredQuery = query(
          collection(db, "registeredEvents"),
          where("userId", "==", user.uid),
          where("eventId", "==", selectedEvent.id)
        );
        const snapshot = await getDocs(registeredQuery);
        setIsRegistered(!snapshot.empty);
      } catch (error) {
        console.error("Error checking registration:", error);
      }
    };

    checkRegistration();
  }, [selectedEvent, user]);

  const handleRegisterEvent = async () => {
    if (!selectedEvent || !user) return;

    Alert.alert(
      'Register for Event',
      `Are you sure you want to register for "${selectedEvent.eventName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            try {
              // Fetch user details
              const userDoc = await getDoc(doc(db, "users", user.uid));
              const userData = userDoc.data();

              await addDoc(collection(db, "registeredEvents"), {
                userId: user.uid,
                eventId: selectedEvent.id,
                registeredAt: Timestamp.now(),
                name: userData?.displayName || userData?.email || 'Name',
                email: user.email || 'mail',
              });
              setIsRegistered(true);
              Alert.alert('Success', 'You have successfully registered for this event!');
              // Schedule notifications
              await scheduleNotification(selectedEvent);
            } catch (error) {
              console.error('Error registering for event:', error);
              Alert.alert('Error', 'Failed to register for the event. Please try again.');
            }
          },
        },
      ]
    );
  };

  // This block shows a spinner and prevents the FlatList from rendering
  // while Firebase checks the user's login status.
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primaryRed} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color={Colors.darkText} />
        </TouchableOpacity>
      </View>
      {user ? (
        // If the user is logged in, render the list of events.
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.eventCard} onPress={() => { setSelectedEvent(item); setModalVisible(true); }}>
              <Text style={styles.eventTitle}>{item.eventName}</Text>
              {/* This is a safer way to render text that might be missing */}
              {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        // If there's no user, render a clear message.
        <View style={styles.centered}>
          <Text>Please log in to see events.</Text>
        </View>
      )}

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
            <Icon name="close" size={24} color={Colors.darkText} />
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

              {userRole === "organizer" && selectedEvent.createdBy === auth.currentUser?.uid && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setModalVisible(false);
                    router.push(`/(organizer)/createEvent?eventId=${selectedEvent.id}`);
                  }}
                >
                  <Text style={styles.editButtonText}>Edit Event</Text>
                </TouchableOpacity>
              )}

              {userRole === "student" && (selectedEvent.category === "Tech" || selectedEvent.category === "NonTech") && !isRegistered && (
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegisterEvent}
                >
                  <Text style={styles.registerButtonText}>Register for Event</Text>
                </TouchableOpacity>
              )}

              {userRole === "student" && (selectedEvent.category === "Tech" || selectedEvent.category === "NonTech") && isRegistered && (
                <View style={styles.registeredContainer}>
                  <Text style={styles.registeredText}>You are registered for this event</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  logoutButton: {
    padding: 5,
  },
  listContent: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryRed,
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.subtleText,
  },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  closeButton: { position: "absolute", top: 20, right: 20, zIndex: 1 },
  modalContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: Colors.darkText, marginBottom: 5 },
  modalDateTime: { fontSize: 14, color: Colors.subtleText, marginBottom: 15 },
  eventImage: { width: 250, height: 150, borderRadius: 10, marginBottom: 10, backgroundColor: Colors.border },
  modalDescription: { fontSize: 16, color: Colors.darkText, lineHeight: 24, marginBottom: 20 },
  modalInfoBox: { backgroundColor: "#F0F2F5", padding: 15, borderRadius: 10, marginBottom: 10 },
  modalLabel: { fontSize: 14, fontWeight: "600", color: Colors.subtleText, marginBottom: 3 },
  modalText: { fontSize: 16, color: Colors.darkText },
  editButton: { backgroundColor: Colors.primaryRed, padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  editButtonText: { color: Colors.background, fontSize: 16, fontWeight: "bold" },
  registerButton: { backgroundColor: Colors.primaryRed, padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  registerButtonText: { color: Colors.background, fontSize: 16, fontWeight: "bold" },
  registeredContainer: { backgroundColor: "#E9F7EF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  registeredText: { color: "#28A745", fontSize: 16, fontWeight: "bold" },
});

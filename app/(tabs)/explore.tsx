import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// --- Import the new Auth hook and Firebase config ---
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

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
  registeredStudents?: { userId: string; name: string; email?: string }[];
}

const Colors = {
  primaryRed: "#B80000",
  darkText: "#212529",
  subtleText: '#6C757D',
  border: '#DEE2E6',
  background: "#FFFFFF",
};

export default function YourEventsScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isLoading || !user) return;

    const fetchUserRoleAndEvents = async () => {
      try {
        // Get user role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;
        setUserRole(role);

        if (role === 'organizer') {
          // For organizers: fetch events they created
          const eventsQuery = query(
            collection(db, "events"),
            where("createdBy", "==", user.uid)
          );

          const unsubscribe = onSnapshot(eventsQuery, async (snapshot) => {
            const eventsList = await Promise.all(
              snapshot.docs.map(async (eventDoc) => {
                const eventData = eventDoc.data() as Event;
                const eventId = eventDoc.id;

                // Get registered students for this event
                const registeredQuery = query(
                  collection(db, "registeredEvents"),
                  where("eventId", "==", eventId)
                );
                const registeredSnapshot = await getDocs(registeredQuery);

                // Fetch student details
                const studentPromises = registeredSnapshot.docs.map(async (regDoc) => {
                  const regData = regDoc.data();
                  // Fetch user email from users collection if not in registeredEvents
                  const userDoc = await getDoc(doc(db, "users", regData.userId));
                  const userData = userDoc.data();
                  return {
                    userId: regData.userId,
                    name: regData.name || 'Unknown',
                    email: regData.email || userData?.email || '',
                  };
                });

                const registeredStudents = await Promise.all(studentPromises);

                return {
                  ...eventData,
                  id: eventId,
                  registeredStudents,
                } as Event;
              })
            );

            setEvents(eventsList.sort((a, b) => {
              if (!a.dateTime) return 1;
              if (!b.dateTime) return -1;
              return a.dateTime.toMillis() - b.dateTime.toMillis();
            }));
          });

          return () => unsubscribe();
        } else if (role === 'student') {
          // For students: fetch events they registered for
          const registeredQuery = query(
            collection(db, "registeredEvents"),
            where("userId", "==", user.uid)
          );

          const unsubscribe = onSnapshot(registeredQuery, async (snapshot) => {
            const registeredEventIds = snapshot.docs.map(doc => doc.data().eventId);

            if (registeredEventIds.length === 0) {
              setEvents([]);
              return;
            }

            // Fetch the actual event details
            const eventsPromises = registeredEventIds.map(eventId =>
              getDoc(doc(db, "events", eventId))
            );

            const eventsSnapshots = await Promise.all(eventsPromises);
            const eventsList = eventsSnapshots
              .filter(snapshot => snapshot.exists())
              .map(snapshot => ({
                id: snapshot.id,
                ...snapshot.data(),
              })) as Event[];

            setEvents(eventsList.sort((a, b) => {
              if (!a.dateTime) return 1;
              if (!b.dateTime) return -1;
              return a.dateTime.toMillis() - b.dateTime.toMillis();
            }));
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchUserRoleAndEvents();
  }, [user, isLoading, refreshKey]);

  // New function to handle cancel registration
  const handleCancelRegistration = async () => {
    if (!user || !selectedEvent) return;

    try {
      // Query registeredEvents collection for the registration document
      const regQuery = query(
        collection(db, "registeredEvents"),
        where("userId", "==", user.uid),
        where("eventId", "==", selectedEvent.id)
      );

      const regSnapshot = await getDocs(regQuery);

      if (!regSnapshot.empty) {
        // Delete the registration document (assuming one per user per event)
        await deleteDoc(doc(db, "registeredEvents", regSnapshot.docs[0].id));

        // Refresh the events list
        setRefreshKey(prev => prev + 1);
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Error cancelling registration:", error);
    }
  };

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
        <Text style={styles.headerTitle}>Your Events</Text>
        <TouchableOpacity onPress={() => setRefreshKey(prev => prev + 1)} style={styles.reloadButton}>
          <Icon name="refresh" size={24} color={Colors.darkText} />
        </TouchableOpacity>
      </View>
      {user ? (
        events.length > 0 ? (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.eventCard} onPress={() => { setSelectedEvent(item); setModalVisible(true); }}>
                <Text style={styles.eventTitle}>{item.eventName}</Text>
                {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}
                <Text style={styles.eventCategory}>{item.category}</Text>
                {userRole === 'organizer' && item.registeredStudents && (
                  <Text style={styles.registrationCount}>
                    {item.registeredStudents.length} registered student{item.registeredStudents.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.noEventsText}>
              {userRole === 'organizer'
                ? "You haven't created any events yet."
                : "You haven't registered for any events yet."}
            </Text>
            <Text style={styles.noEventsSubtext}>
              {userRole === 'organizer'
                ? "Go to Create Event to add your first event."
                : "Go to Home tab to explore and register for events."}
            </Text>
          </View>
        )
      ) : (
        <View style={styles.centered}>
          <Text>Please log in to see your events.</Text>
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

              {userRole === 'organizer' && selectedEvent.registeredStudents && selectedEvent.registeredStudents.length > 0 && (
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalLabel}>Registered Students ({selectedEvent.registeredStudents.length})</Text>
                  {selectedEvent.registeredStudents.map((student, index) => (
                    <Text key={student.userId} style={styles.modalText}>
                      {index + 1}. {student.email}
                    </Text>
                  ))}
                </View>
              )}

              {userRole === 'student' && (
                <TouchableOpacity
                  style={styles.cancelRegistrationButton}
                  onPress={handleCancelRegistration}
                >
                  <Text style={styles.cancelRegistrationButtonText}>Cancel Registration</Text>
                </TouchableOpacity>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  reloadButton: {
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
    marginBottom: 5,
  },
  eventCategory: {
    fontSize: 12,
    color: Colors.subtleText,
    fontStyle: 'italic',
  },
  registrationCount: {
    fontSize: 14,
    color: Colors.primaryRed,
    fontWeight: '500',
    marginTop: 5,
  },
  noEventsText: {
    fontSize: 18,
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: 10,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: Colors.subtleText,
    textAlign: 'center',
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
  cancelRegistrationButton: {
    backgroundColor: Colors.primaryRed,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelRegistrationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

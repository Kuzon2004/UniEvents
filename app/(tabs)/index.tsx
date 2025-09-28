import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// --- Import the new Auth hook and Firebase config ---
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

const Colors = {
  primaryRed: "#B80000",
  darkText: "#212529",
  subtleText: '#6C757D',
  border: '#DEE2E6',
};

export default function HomeScreen() {
  const { user, isLoading } = useAuth(); 
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsCollection = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCollection);
        const eventsList = eventSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsList);
      } catch (error) {
        // The permission error will be caught here if fetchEvents is called too early
        console.error("Error fetching events for home screen: ", error);
      }
    };

    // This condition is the key: only fetch if not loading and a user exists.
    if (!isLoading && user) {
      fetchEvents();
    }
  }, [user, isLoading]);

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
      </View>
      {user ? (
        // If the user is logged in, render the list of events.
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>{item.eventName}</Text> 
              {/* This is a safer way to render text that might be missing */}
              {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        // If there's no user, render a clear message.
        <View style={styles.centered}>
          <Text>Please log in to see events.</Text>
        </View>
      )}
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkText,
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
});
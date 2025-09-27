
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../firebaseConfig';

const Colors = {
  primaryRed: "#B80000",
  darkText: "#212529",
};

export default function HomeScreen() {
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
        console.error("Error fetching events for home screen: ", error);
      }
    };

    fetchEvents();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
      </View>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDescription}>{item.description}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B80000',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
});
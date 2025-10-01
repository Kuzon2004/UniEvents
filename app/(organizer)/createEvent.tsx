import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Firebase ---
import { addDoc, collection, deleteDoc, doc, GeoPoint, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';

const Colors = {
  primaryRed: '#B80000',
  accentNavy: '#0D2A4C',
  darkText: '#212529',
  subtleText: '#5A5A5A',
  background: '#FFFFFF',
  border: '#DEE2E6',
};

const CreateEventScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string | undefined;
  const isEditing = !!eventId;
  const lat = params.lat ? parseFloat(params.lat as string) : undefined;
  const lng = params.lng ? parseFloat(params.lng as string) : undefined;

  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState({ building: '', floor: '', room: '' });
  const [organizer, setOrganizer] = useState({ name: '', phoneNumber: '' });
  const [category, setCategory] = useState('NonTech');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load event data if editing
  useEffect(() => {
    if (isEditing && eventId) {
      const loadEvent = async () => {
        try {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            setEventName(eventData.eventName || '');
            setDescription(eventData.description || '');
            setVenue(eventData.venueDetails || { building: '', floor: '', room: '' });
            setOrganizer(eventData.organizerInfo || { name: '', phoneNumber: '' });
            setCategory(eventData.category || 'NonTech');
            setImageUrls(eventData.imageUrls || []);
            setDate(eventData.dateTime?.toDate() || new Date());
          }
        } catch (error) {
          console.error('Error loading event:', error);
          Alert.alert('Error', 'Could not load event data.');
        }
      };
      loadEvent();
    }
  }, [isEditing, eventId]);

  // --- Date & Time ---
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') return setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setShowDatePicker(false);
      if (Platform.OS === 'android') setShowTimePicker(true);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (event.type === 'dismissed') return setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
      setShowTimePicker(false);
    }
  };

  // --- Image Picker & Upload ---
  const takePhoto = async () => {
    if (imageUrls.length >= 3) {
      Alert.alert('Limit Reached', 'You can only upload a maximum of 3 photos.');
      return;
    }

    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', "You need camera access to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    if (imageUrls.length >= 3) {
      Alert.alert('Limit Reached', 'You can only upload a maximum of 3 photos.');
      return;
    }

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', "You need media library access to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `event-images/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setImageUrls(prev => [...prev, downloadURL]);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Save Event ---
  const handleSaveEvent = async () => {
    if (!eventName || !description || (!isEditing && (!lat || !lng))) {
      Alert.alert('Missing Info', 'Fill all required fields and select a location.');
      return;
    }

    try {
      if (isEditing && eventId) {
        await updateDoc(doc(db, 'events', eventId), {
          eventName,
          description,
          category,
          dateTime: Timestamp.fromDate(date),
          venueDetails: venue,
          organizerInfo: organizer,
          imageUrls,
          ...(lat && lng && { location: new GeoPoint(lat, lng) }),
        });
        Alert.alert('Event Updated', 'Your event has been successfully updated.');
      } else {
        await addDoc(collection(db, 'events'), {
          eventName,
          description,
          category,
          dateTime: Timestamp.fromDate(date),
          venueDetails: venue,
          organizerInfo: organizer,
          imageUrls,
          location: new GeoPoint(lat!, lng!),
          createdBy: auth.currentUser?.uid,
          createdAt: Timestamp.now(),
        });
        Alert.alert('Event Created', 'Your event has been successfully created.');
      }
      router.back();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', `Could not ${isEditing ? 'update' : 'create'} event.`);
    }
  };

  // --- Delete Event ---
  const handleDeleteEvent = async () => {
    if (!isEditing || !eventId) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'events', eventId));
              Alert.alert('Event Deleted', 'The event has been successfully deleted.');
              router.back();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Could not delete event.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{isEditing ? 'Edit Event' : 'Create New Event'}</Text>

        <TextInput style={styles.input} placeholder="Event Name" value={eventName} onChangeText={setEventName} />
        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} multiline />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          {['Tech', 'NonTech', 'Food'].map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, category === cat && styles.selectedCategoryButton]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryButtonText, category === cat && styles.selectedCategoryButtonText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Venue Details</Text>
        <TextInput style={styles.input} placeholder="Building" value={venue.building} onChangeText={text => setVenue(v => ({...v, building: text}))} />
        <TextInput style={styles.input} placeholder="Floor" value={venue.floor} onChangeText={text => setVenue(v => ({...v, floor: text}))} />
        <TextInput style={styles.input} placeholder="Room No" value={venue.room} onChangeText={text => setVenue(v => ({...v, room: text}))} />

        <Text style={styles.label}>Organizer Details</Text>
        <TextInput style={styles.input} placeholder="Organizer Name" value={organizer.name} onChangeText={text => setOrganizer(o => ({...o, name: text}))} />
        <TextInput style={styles.input} placeholder="Phone Number" value={organizer.phoneNumber} onChangeText={text => setOrganizer(o => ({...o, phoneNumber: text}))} keyboardType="phone-pad" />

        {lat && lng && <Text style={styles.label}>Selected Location: {lat.toFixed(6)}, {lng.toFixed(6)}</Text>}

        <Text style={styles.label}>Event Date & Time</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Text>{date.toLocaleDateString()} {date.toLocaleTimeString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
        )}
        {showTimePicker && (
          <DateTimePicker value={date} mode="time" display="default" onChange={onTimeChange} />
        )}

        <Text style={styles.label}>Event Photos ({imageUrls.length}/3)</Text>
        <View style={styles.imageContainer}>
          {imageUrls.map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.thumbnail} />
          ))}
        </View>
        <TouchableOpacity onPress={takePhoto} style={styles.button} disabled={isUploading}>
          <Text style={styles.buttonText}>{isUploading ? 'Uploading...' : 'Take Photo'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickFromGallery} style={styles.button} disabled={isUploading}>
          <Text style={styles.buttonText}>{isUploading ? 'Uploading...' : 'Choose from Gallery'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={[styles.button, styles.cancelButton]}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSaveEvent} style={[styles.button, styles.saveButton]}>
          <Text style={styles.buttonText}>{isEditing ? 'Update Event' : 'Save Event'}</Text>
        </TouchableOpacity>
        {isEditing && (
          <TouchableOpacity onPress={handleDeleteEvent} style={[styles.button, styles.deleteButton]}>
            <Text style={styles.buttonText}>Delete Event</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.accentNavy, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.darkText, marginTop: 15, marginBottom: 5 },
  input: {
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.accentNavy,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  saveButton: { backgroundColor: Colors.primaryRed, marginTop: 10 },
  cancelButton: { backgroundColor: '#6c757d', marginTop: 10, marginRight: 10 },
  deleteButton: { backgroundColor: '#dc3545', marginTop: 10 },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  thumbnail: { width: 100, height: 100, borderRadius: 8, margin: 5 },
  categoryContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  categoryButton: { backgroundColor: '#F0F2F5', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, alignItems: 'center', flex: 1, marginHorizontal: 5 },
  selectedCategoryButton: { backgroundColor: Colors.primaryRed, borderColor: Colors.primaryRed },
  categoryButtonText: { color: Colors.darkText, fontSize: 16 },
  selectedCategoryButtonText: { color: Colors.background, fontWeight: 'bold' },
});

export default CreateEventScreen;

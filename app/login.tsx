import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "../firebaseConfig";

const Colors = {
  primaryRed: "#B80000",
  accentNavy: "#0D2A4C",
};

const LoginScreen = () => {
  const router = useRouter();

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log(`Logged in as ${email}`);
      router.replace('/(tabs)/map');
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>UniEvents</Text>
          <Text style={styles.tagline}>Dev Login</Text>
          
          <TouchableOpacity 
            style={styles.devLoginButton} 
            onPress={() => handleLogin('student@test.com', 'password123')}>
            <Text style={styles.devLoginButtonText}>Log In as Student</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.devLoginButton} 
            onPress={() => handleLogin('organizer@test.com', 'password123')}>
            <Text style={styles.devLoginButtonText}>Log In as Organizer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0F2F5" },
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  welcomeText: { fontSize: 28, fontWeight: "700", color: Colors.primaryRed, marginBottom: 5 },
  tagline: { fontSize: 16, color: '#5A5A5A', marginBottom: 30 },
  devLoginButton: {
    width: '100%',
    marginTop: 10,
    padding: 15,
    backgroundColor: Colors.accentNavy,
    borderRadius: 10,
    alignItems: 'center',
  },
  devLoginButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default LoginScreen;
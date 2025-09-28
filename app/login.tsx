import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAuth } from "../context/AuthContext";

const Colors = {
  primaryRed: "#B80000",
  accentNavy: "#0D2A4C",
};

const LoginScreen = () => {
  const router = useRouter();
  const { signInWithEmailAndPassword, createUserWithEmailAndPassword, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);



  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    try {
      await signInWithEmailAndPassword(email, password);
      // Navigation will happen via useEffect when user is set
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    Alert.alert(
      "Confirm Sign Up",
      "Are you sure you want to create an account with this email and password?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              await createUserWithEmailAndPassword(email, password);
              // Navigation will happen via useEffect when user is set
            } catch (error: any) {
              Alert.alert("Sign Up Failed", error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>UniEvents</Text>
          <Text style={styles.tagline}>Sign in to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
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
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    fontSize: 16,
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 15,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  loginButton: {
    width: '100%',
    padding: 15,
    backgroundColor: Colors.accentNavy,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  signUpButton: {
    width: '100%',
    padding: 15,
    backgroundColor: Colors.primaryRed,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default LoginScreen;
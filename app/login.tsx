import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // You'll need to install this library

// --- Color Palette ---
const Colors = {
  primaryRed: "#B80000",
  accentNavy: "#0D2A4C",
  darkText: "#212529",
  subtleText: "#5A5A5A",
  background: "#FFFFFF",
  border: "#DEE2E6",
};

// --- Login Screen Component ---
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Logging in with:", email, password);
    // Implement your authentication logic here
  };

  const handleForgotPassword = () => {
    console.log("Forgot password pressed");
    // Navigate to forgot password screen
  };

  const handleCreateAccount = () => {
    console.log("Create account pressed");
    // Navigate to create account screen
  };

  const handleGoogleSignIn = () => {
    console.log("Sign in with Google");
    // Implement Google Sign-In logic
  };

  const handleAppleSignIn = () => {
    console.log("Sign in with Apple");
    // Implement Apple Sign-In logic
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>UniEvents</Text>
          <Text style={styles.tagline}>Anna University</Text>

          <View style={styles.inputContainer}>
            <Icon
              name="email-outline"
              size={20}
              color={Colors.subtleText}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="University Email"
              placeholderTextColor={Colors.subtleText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon
              name="lock-outline"
              size={20}
              color={Colors.subtleText}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={Colors.subtleText}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreateAccount}
            style={styles.createAccountButton}
          >
            <Text style={styles.createAccountButtonText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.signInWithText}>Sign in with</Text>
          <View style={styles.socialLoginContainer}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={styles.socialIconButton}
            >
              <Icon name="google" size={28} color={Colors.darkText} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAppleSignIn}
              style={styles.socialIconButton}
            >
              <Icon name="apple" size={28} color={Colors.darkText} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5", // A very light background for the whole screen, outside the card
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 15,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primaryRed,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.subtleText,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    height: "100%",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: Colors.accentNavy, // Using accent navy for links
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: Colors.primaryRed,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  loginButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: "700",
  },
  createAccountButton: {
    backgroundColor: Colors.background,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.accentNavy, // Outlined button using accent navy
    marginBottom: 30,
  },
  createAccountButtonText: {
    color: Colors.accentNavy,
    fontSize: 18,
    fontWeight: "700",
  },
  signInWithText: {
    color: Colors.subtleText,
    fontSize: 14,
    marginBottom: 15,
  },
  socialLoginContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%", // Adjust width as needed
  },
  socialIconButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#EAEAEA", // Light gray background for social buttons
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default LoginScreen;

import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../lib/supabase"; // juster path hvis nødvendig
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function AuthGateScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 1. Sjekk om bruker er logget inn
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigation.replace("Login");
        return;
      }

      // 2. Sjekk om PIN finnes
      const storedPin = await SecureStore.getItemAsync("user_pin");

      if (storedPin) {
        navigation.replace("PinLogin");
      } else {
        navigation.replace("CreatePin");
      }
    } catch (error) {
      console.error("AuthGate error:", error);
      navigation.replace("Login");
    } finally {
      setLoading(false);
    }
  };

  // Loader mens vi sjekker
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A2A40',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6FA5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 18,
    color: '#5A2A40',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
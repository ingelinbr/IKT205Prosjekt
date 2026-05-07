import React, { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function AuthGateScreen({ navigation }: any) {
  useEffect(() => {
    checkAuth();
  }, []);

  async function ensureProfileExists(user: any) {
    const fallbackUsername =
      user.user_metadata?.username || user.email?.split('@')[0] || 'Bruker';

    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.log('Error checking profile:', checkError.message);
      return;
    }

    if (existingProfile) {
      return;
    }

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      username: fallbackUsername,
      favorite_team: null,
    });

    if (insertError) {
      console.log('Error creating profile:', insertError.message);
    }
  }

  async function checkAuth() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.log('Error getting session:', error.message);
        navigation.replace('Login');
        return;
      }

      if (!session?.user) {
        navigation.replace('Login');
        return;
      }

      await ensureProfileExists(session.user);

      const storedPin = await SecureStore.getItemAsync('user_pin');

      if (storedPin) {
        navigation.replace('PinLogin');
      } else {
        navigation.replace('CreatePin', {
          username:
            session.user.user_metadata?.username ||
            session.user.email?.split('@')[0] ||
            'Bruker',
        });
      }
    } catch (error) {
      console.error('AuthGate error:', error);
      navigation.replace('Login');
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5A2A40" />
      <Text style={styles.loadingText}>Laster app...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#5A2A40',
    fontWeight: '700',
  },
});
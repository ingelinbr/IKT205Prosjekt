import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import CreatePinScreen from '../screens/CreatePinScreen';
import PinLoginScreen from '../screens/PinLoginScreen';
import AuthGateScreen from '../screens/AuthGateScreen';
import PreviousMatchesScreen from '../screens/PreviousMatchesScreen';
import LeagueDetailScreen from '../screens/LeagueDetailScreen';
import AllMatchesScreen from '../screens/AllMatchesScreen';

export type RootStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  PinLogin: undefined;
  CreatePin: { username: string };
  Main: { username: string } | undefined;
  PreviousMatches: undefined;
  LeagueDetail: {
    leagueId: string;
    leagueName: string;
    joinCode: string;
  };
  AllMatches: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AuthGate"
        screenOptions={{
          headerStyle: { backgroundColor: '#FFE4EC' },
          headerTintColor: '#5A2A40',
          headerTitleStyle: { fontWeight: 'bold' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#FFF0F5' },
        }}
      >
        <Stack.Screen
          name="AuthGate"
          component={AuthGateScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Velkommen' }}
        />

        <Stack.Screen
          name="PinLogin"
          component={PinLoginScreen}
          options={{ title: 'PIN' }}
        />

        <Stack.Screen
          name="CreatePin"
          component={CreatePinScreen}
          options={{ title: 'Lag PIN' }}
        />

        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ title: 'Premier League Predictor' }}
        />

        <Stack.Screen
          name="PreviousMatches"
          component={PreviousMatchesScreen}
          options={{ title: 'Tidligere kamper' }}
        />

        <Stack.Screen
          name="LeagueDetail"
          component={LeagueDetailScreen}
          options={{ title: 'Liga' }}
        />
        <Stack.Screen
          name="AllMatches"
          component={AllMatchesScreen}
          options={{ title: 'Alle kamper' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
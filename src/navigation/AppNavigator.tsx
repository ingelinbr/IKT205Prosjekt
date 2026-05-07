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
import LeaderboardScreen from '../screens/LeaderboardScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import TeamLeagueScreen from '../screens/TeamLeagueScreen';

export type RootStackParamList = {
  AuthGate: undefined;
  Login: undefined;
  PinLogin: undefined;
  CreatePin: { username: string };
  Main: { username: string } | undefined;
  PreviousMatches: undefined;
  AllMatches: undefined;
  Leaderboard: undefined;
  LeagueDetail: {
    leagueId: string;
    leagueName: string;
    joinCode: string;
  };
  EditProfile: {
    currentUsername: string;
    currentFavoriteTeam: string | null;
  };
  PublicProfile: {
    userId: string;
  };
  TeamLeague: {
    teamName: string;
  };
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
          name="AllMatches"
          component={AllMatchesScreen}
          options={{ title: 'Alle kamper' }}
        />

        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: 'Global liga' }}
        />

        <Stack.Screen
          name="LeagueDetail"
          component={LeagueDetailScreen}
          options={{ title: 'Liga' }}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: 'Rediger profil' }}
        />

        <Stack.Screen
          name="PublicProfile"
          component={PublicProfileScreen}
          options={{ title: 'Profil' }}
        />

        <Stack.Screen
          name="TeamLeague"
          component={TeamLeagueScreen}
          options={{ title: 'Favorittlag-liga' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
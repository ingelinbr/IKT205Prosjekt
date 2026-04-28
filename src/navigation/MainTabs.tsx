import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import HomeScreen from '../screens/HomeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import LeaguesScreen from '../screens/LeaguesScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  MatchesTab: undefined;
  Leaderboard: undefined;
  LeaguesTab: undefined; // LEGG TIL DENNE
};

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#5A2A40',
        tabBarInactiveTintColor: '#A06A85',
        tabBarStyle: {
          backgroundColor: '#FFE4EC',
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#5A2A40',
          height: 3,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          textTransform: 'none',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Hjem' }}
      />

      <Tab.Screen
        name="MatchesTab"
        component={MatchesScreen}
        options={{ title: 'Kamper' }}
      />

      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Toppliste' }}
      />
      <Tab.Screen
        name="LeaguesTab"
        component={LeaguesScreen}
        options={{ title: 'Ligaer' }}
      />

    </Tab.Navigator>
  );
}
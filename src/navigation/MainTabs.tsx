import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import HomeScreen from '../screens/HomeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import LeaguesScreen from '../screens/LeaguesScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  MatchesTab: undefined;
  LeaguesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        swipeEnabled: true,
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
        name="LeaguesTab"
        component={LeaguesScreen}
        options={{ title: 'Ligaer' }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
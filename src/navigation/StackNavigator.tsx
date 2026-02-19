import React from 'react';
import { Image, Platform, View } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

import SettingsScreen from '../screens/dashboard/settings/SettingsScreen';
import DrawerNavigator from './DrawerNavigator';
import TabNavigator from './TabNavigator';
import AttendanceScreen from '../screens/dashboard/attendance/AttendanceScreen';
import DisplayScreen from '../screens/dashboard/display/DisplayScreen';
 import PrivacyPolicyScreen from '../screens/dashboard/privacy/PrivacyPolicyScreen';
import WebScreen from '../screens/dashboard/web/WebScreen';
import ListScreen from '../screens/dashboard/list_page/ListScreen';
import PageScreen from '../screens/dashboard/page/Page';
import { ERP_ICON } from '../assets';
import { ERP_COLOR_CODE } from '../utils/constants';
import StartupScreen from '../screens/dashboard/startup/StartupScreen';
import PinSetupScreen from '../screens/dashboard/pinset/Pinset';
import PinVerifyScreen from '../screens/dashboard/pinset/PinVerify';
import { useAppSelector } from '../store/hooks';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import LocationTrackScreen from '../screens/dashboard/tabs/home/LocationTrack';

const Stack = createStackNavigator<any>();

const StackNavigator = () => {
  const { isPinLoaded } = useAppSelector(state => state?.auth);
  const smoothTransition = {
    gestureEnabled: true,
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
  };
 

  const globalTransition = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      opacity: current.progress,
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width * 0.08, 0],
          }),
        },
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.98, 1],
          }),
        },
      ],
    },
  }),
  transitionSpec: {
    open: {
      animation: 'timing',
      config: { duration: 320 },
    },
    close: {
      animation: 'timing',
      config: { duration: 280 },
    },
  },
};

  const screenOptions = {
    headerShown: true,
    headerBackImage: () => Platform.OS === 'ios' ? 
    ( 
      <View
        style={{ width: 24,  marginLeft: 12, }}
      >
        <MaterialIcons name="chevron-left" size={34} color="#fff" />
      </View>
    )
    : ( 
       
      <Image
        source={ERP_ICON.BACK}
        style={{ width: 24, height: 24, marginLeft: 10, tintColor: 'white' }}
        resizeMode="contain"
      />
    ),
    headerStyle: {
      backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
    },
    headerTintColor: ERP_COLOR_CODE.ERP_WHITE,
    headerTitleStyle: {
      fontSize: 18,
      headerTitleAlign: 'left',
      fontWeight: 'bold',
      color: ERP_COLOR_CODE.ERP_WHITE,
    },
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
        },
      },
    },
    ...smoothTransition,
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {},
      }}
    >
      {isPinLoaded === true && (
        <Stack.Screen name="Startup" component={StartupScreen} options={smoothTransition} />
      )}
      <Stack.Screen name="Drawer" component={DrawerNavigator} options={smoothTransition} />
      <Stack.Screen options={screenOptions} name="Settings" component={SettingsScreen} />
      <Stack.Screen options={screenOptions} name="PinSet" component={PinSetupScreen} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
        name="PinVerify"
        component={PinVerifyScreen}
      />
      <Stack.Screen name="Home" component={TabNavigator} />
     <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          ...screenOptions,
          gestureEnabled: false,  // Back button hide
        }}
      />

      <Stack.Screen options={screenOptions} name="MyAttendance" component={AttendanceScreen} />
      <Stack.Screen options={screenOptions} name="Business" component={DisplayScreen} />
      {/* <Stack.Screen options={screenOptions} name="File Manager" component={ScanScreen} /> */}
      <Stack.Screen options={screenOptions} name="Privacy Policy" component={PrivacyPolicyScreen} />
      <Stack.Screen options={screenOptions} name="Web" component={WebScreen} />
      <Stack.Screen options={screenOptions} name="Page" component={PageScreen} />
      <Stack.Screen options={screenOptions} name="List" component={ListScreen} />
      <Stack.Screen options={screenOptions} name="LocationTrack" component={LocationTrackScreen} />

      <Stack.Screen name="Tasks" component={DisplayScreen} options={screenOptions} />
    </Stack.Navigator>
  );
};

export default StackNavigator;



import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import TabNavigator from './TabNavigator';
import useTranslations from '../hooks/useTranslations';
import { ERP_COLOR_CODE } from '../utils/constants';

const Stack = createStackNavigator();

const DrawerNavigator = () => {
  const { t } = useTranslations();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="Home"
        component={TabNavigator}
        options={{
          headerShown: false,
          title: t('navigation.home'),
        }}
      />
    </Stack.Navigator>
  );
};

export default DrawerNavigator;

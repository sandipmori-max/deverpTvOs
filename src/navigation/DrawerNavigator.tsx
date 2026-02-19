import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import TabNavigator from './TabNavigator';
import CustomDrawerContent from '../components/drawer/CustomDrawerContent';
import useTranslations from '../hooks/useTranslations';
import { useAppSelector } from '../store/hooks';
import { ERP_COLOR_CODE } from '../utils/constants';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const { t } = useTranslations();
  const theme = useAppSelector(state => state.theme.mode);

  return (
    <>
      <Drawer.Navigator
        initialRouteName="Home"
        drawerContent={props => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="Home"
          options={{
            headerShown: false,
            headerStyle: {
              backgroundColor: theme === 'dark' ? ERP_COLOR_CODE.ERP_BLACK : ERP_COLOR_CODE.ERP_APP_COLOR,
            },
            headerTintColor: ERP_COLOR_CODE.ERP_WHITE,
            title: t('navigation.home'),
          }}
          component={TabNavigator}
        />
      </Drawer.Navigator>
    </>
  );
};

export default DrawerNavigator;

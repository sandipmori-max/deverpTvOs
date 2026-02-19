import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DARK_COLOR, ERP_COLOR_CODE } from "../utils/constants";
import MenuTab from "../screens/dashboard/tabs/MenuTab/MenuTab";
import HomeScreen from "../screens/dashboard/tabs/home/HomeTab";
import ProfileTab from "../screens/dashboard/tabs/profile/ProfileTab";
import useTranslations from "../hooks/useTranslations";
import { useAppSelector } from "../store/hooks";
import AnimatedTabIcon from "../components/tab_icon/AnimatedTabIcon";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const theme = useAppSelector((state) => state.theme.mode);
  const { t } = useTranslations();
  const { appBottomMenuList } = useAppSelector(state => state?.auth);

  const navigationItems = (appBottomMenuList || []).map(item => ({
      name:  item?.name,
      type: item?.type,
      icon: item?.icon,
      label: item?.name,
      search: item?.name,
  }));

  const tabConfig = [
    {
      name: t("navigation.home"),
      component: HomeScreen,
      icon: "home",
      label: t("navigation.home"),
    },
    {
      name: t("navigation.entry"),
      type: "E",
      icon: "entry",
      label: t("navigation.entry"),
      search: t("navigation.search_entry"),
    },
    {
      name: t("navigation.report"),
      type: "R",
      icon: "report",
      label: t("navigation.report"),
      search: t("navigation.search_report"),
    },
    {
      name: t("navigation.auth"),
      type: "A",
      icon: "auth",
      label: t("navigation.auth"),
      search: t("navigation.search_auth"),
    },
    {
      name: t("navigation.profile"),
      component: ProfileTab,
      icon: "profile",
      label: t("navigation.profile"),
    },
  ];

  return (
     <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: ERP_COLOR_CODE.ERP_APP_COLOR,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 46,
          paddingBottom: 5,
          paddingTop: 5,
          width: '28%',
          alignContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
         },
        tabBarShowLabel: false,

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {tabConfig.map((tab, index) => (
        <Tab.Screen
          key={index}
          name={tab.name}
          children={
            tab.component
              ? () => <tab.component />
              : () => (
                  <MenuTab
                    type={tab.type}
                    headerText={tab.label}
                    searchPlaceholder={tab.search}
                  />
                )
          }
          options={{
            tabBarLabel: tab.label,
            title: tab.label,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "500",
              marginTop: 8,
            },
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                name={tab.icon}
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default TabNavigator;

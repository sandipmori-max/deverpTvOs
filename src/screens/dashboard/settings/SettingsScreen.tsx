import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  ScrollView,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { styles } from './settings_style';
import CustomAlert from '../../../components/alert/CustomAlert';
import useTranslations from '../../../hooks/useTranslations';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {
  logoutUserThunk,
  removeAccountThunk,
  switchAccountThunk,
} from '../../../store/slices/auth/thunk';
import { ERP_COLOR_CODE, setERPTheme } from '../../../utils/constants';
import {
  createAccountsTable,
  getActiveAccount,
  getDBConnection,
  logoutUser,
} from '../../../utils/sqlite';
import { DevERPService } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../../../hooks/useApi';
import { firstLetterUpperCase, isTokenValid } from '../../../utils/helpers';
import DeviceInfo from 'react-native-device-info';
import { setLang, setTheme } from '../../../store/slices/theme/themeSlice';
import { clearAuthState, setDashboard, setEmptyMenu } from '../../../store/slices/auth/authSlice';
import { resetAjaxState } from '../../../store/slices/ajax/ajaxSlice';
import { resetAttendanceState } from '../../../store/slices/attendance/attendanceSlice';
import { resetDropdownState } from '../../../store/slices/dropdown/dropdownSlice';
import { resetSyncLocationState } from '../../../store/slices/location/syncLocationSlice';
import { Easing } from 'react-native';

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  type: 'toggle' | 'navigate' | 'action';
  value?: boolean;
  action?: string;
}

interface LanguageOption {
  code: string;
  name: string;
}
const HIDDEN_POSITION = 400;

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { t, changeLanguage, getAvailableLanguages, getCurrentLanguage } = useTranslations();
  const [alertVisible, setAlertVisible] = useState(false);
  const theme = useAppSelector(state => state.theme.mode);
const translateY = useRef(new Animated.Value(HIDDEN_POSITION)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [logoutVisible, setLogoutVisible] = useState(false);
  const { user } = useAppSelector(state => state.auth);

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [languages] = useState<LanguageOption[]>(getAvailableLanguages());
  const { execute: validateCompanyCode } = useApi();

  const dispatch = useAppDispatch();

  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info' | 'exit',
  });
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const appVersion = DeviceInfo.getVersion();

 useEffect(() => {
    if (languageModalVisible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [languageModalVisible]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 200,
        duration: 260,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLogoutVisible(false);
      setLanguageModalVisible(false);
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,   // <-- BLACK HEADER
      },
      headerBackTitle: '',
      headerTintColor: '#fff',
      headerTitle: () => (
        <Text
          numberOfLines={1}
          style={{
            maxWidth: 180,
            fontSize: 18,
            fontWeight: '700',
            color: theme === 'dark' ? "white" : ERP_COLOR_CODE.ERP_WHITE,
          }}
        >
          {t('title.title20')}
        </Text>
      ),

    });
  }, [navigation, theme]);


  useEffect(() => {
    setSettings([
      {
        id: '1',
        title: t('settings.pushNotifications'),
        subtitle: t('settings.receiveAlerts'),
        icon: 'notifications-active',
        type: 'toggle',
        value: true,
      },
      {
        id: '2',
        title: t('settings.emailNotifications'),
        subtitle: t('settings.getEmailUpdates'),
        icon: 'mail',
        type: 'toggle',
        value: false,
      },
      {
        id: '3',
        title: t('settings.darkMode'),
        subtitle: t('settings.switchDarkTheme'),
        icon: 'dark-mode',
        type: 'toggle',
        value: false,
      },
      {
        id: '4',
        title: t('settings.biometricAuth'),
        subtitle: t('settings.useBiometric'),
        icon: 'password',
        type: 'navigate',
        value: true,
      },

      {
        id: '5',
        title: t('settings.privacySettings'),
        subtitle: t('settings.managePrivacy'),
        icon: 'security',
        type: 'navigate',
        action: 'Privacy',
      },

      {
        id: '6',
        title: t('settings.language'),
        subtitle: getCurrentLanguage(),
        icon: 'language',
        type: 'navigate',
        action: 'Language',
      },
      {
        id: '7',
        title: t('settings.aboutApp'),
        subtitle: `${t('common.version')} - ${appVersion}`,
        icon: 'info',
        type: 'navigate',
        action: 'About',
      },
      {
        id: '8',
        title: t('settings.helpSupport'),
        subtitle: t('settings.getHelp'),
        icon: 'help',
        type: 'navigate',
        action: 'Support',
      },
      {
        id: '9',
        title: t('settings.logout'),
        subtitle: t('settings.signOut'),
        icon: 'logout',
        type: 'action',
        action: 'Logout',
      },
    ]);
  }, [t, currentLanguage]);

  const handleToggle = (id: string) => {
    setSettings(prevSettings =>
      prevSettings?.map(setting =>
        setting.id === id ? { ...setting, value: !setting.value } : setting,
      ),
    );
  };

  const handleAction = (item: SettingItem) => {
    switch (item?.type) {
      case 'navigate':
        if (item?.title === t('settings.aboutApp')) {
          return;
        }
        if (item?.action === 'Language') {
          setLanguageModalVisible(true);
        } else if (item?.title === t('settings.biometricAuth')) {
          navigation.navigate('PinSet');
        } else if (item?.title === t('settings.privacySettings')) {
          navigation.navigate('Privacy Policy', {
            titlePage: t('settings.privacySettings')
          });

        } else if (item?.title === t('settings.helpSupport')) {
          navigation.navigate('Privacy Policy', {
            url: Platform.OS === 'ios' ? 'https://deverp.com/index.aspx?q=contact_us' : 'http://deverp.com/index.aspx?q=contact_us',
            titlePage: t('settings.helpSupport')
          });
        } else if (item?.action) {
          setAlertConfig({
            title: t('common.navigate'),
            message: `${t('common.navigate')} to ${item?.action} functionality would go here`,
            type: 'info',
          });
          setAlertVisible(true);
          setTimeout(() => {
            setAlertVisible(false);
          }, 1800);
        }
        break;
      case 'action':
        if (item?.action === 'Logout') {
          setLogoutVisible(true);
          setAlertConfig({
            title: t('settings.logout'),
            message:`${firstLetterUpperCase(user?.name || '')}, ${t('settings.logoutConfirm')}`,
            type: 'exit',
          });
          setAlertVisible(true);
        } else if (item?.action) {
          setAlertConfig({
            title: t('common.action'),
            message: `${item?.action} functionality would go here`,
            type: 'info',
          });
          setAlertVisible(true);
        }
        break;
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    dispatch(setLang(languageCode))
    setCurrentLanguage(languageCode);
    setLanguageModalVisible(false);

    setAlertConfig({
      title: t('language.languageChanged'),
      message: t('language.languageChangedMessage'),
      type: 'success',
    });
    setAlertVisible(true);

    setTimeout(() => {
      setAlertVisible(false);
      navigation.goBack()
    }, 1800);
  };

  const renderSettingItem = ({ item }: { item: SettingItem }) => (
    <TouchableOpacity
      style={[styles.settingCard, theme === 'dark' && {
        backgroundColor: 'black'
      }]}
      onPress={() => handleAction(item)}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingHeader}>
        <View style={[styles.settingIcon,
        {
          backgroundColor: theme === 'dark' ? 'black' : "white",
          borderWidth: 1,
          borderColor: 'white'
        }
        ]}>
          <MaterialIcons name={item?.icon} color={theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_BLACK} size={22} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, theme === 'dark' && {
            color: 'white'
          }]}>{item?.title}</Text>
          <Text style={styles.settingSubtitle}>{item?.subtitle}</Text>
        </View>
        {item.type === 'toggle' ? (
          <Switch
            value={item.title === t('settings.darkMode') ? theme === 'dark' : item.value}
            onValueChange={() => {
              handleToggle(item.id);
              if (item.title === t('settings.darkMode')) {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                setERPTheme(newTheme);
                dispatch(setTheme(newTheme));
              }
            }}
            trackColor={{
              false: Platform.OS === 'ios' ? '#e5e7eb' : ERP_COLOR_CODE.ERP_e0e0e0,
              true: '#4CAF50',
            }}
            thumbColor={
              Platform.OS === 'android'
                ? theme === 'dark'
                  ? '#ffffff'
                  : '#f4f3f4'
                : undefined // iOS ignores thumbColor mostly
            }
            ios_backgroundColor="#e5e7eb"
            style={{
              transform: Platform.OS === 'ios' ? [{ scaleX: 0.9 }, { scaleY: 0.9 }] : [],
            }}
          />

        ) : (
          <>{item?.title !== t('settings.aboutApp') && <Text style={styles.arrowIcon}>›</Text>}</>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderLanguageOption = ({ item }: { item: LanguageOption }) => (
    <TouchableOpacity
      style={[
        languageStyles.languageOption,
        currentLanguage === item.code && languageStyles.selectedLanguage,
      ]}
      onPress={() => handleLanguageChange(item.code)}
    >
      <Text
        style={[
          languageStyles.languageName,
          currentLanguage === item.code && languageStyles.selectedLanguageText,
          theme === 'dark' && {
            color: 'white'
          },
          currentLanguage === item.code && theme === 'dark' && {
            color: 'black'
          }
        ]}
      >
        {item.name}
      </Text>
      {currentLanguage === item.code && <MaterialIcons name='done-all' size={22} color={ERP_COLOR_CODE.ERP_APP_COLOR}/>}
    </TouchableOpacity>
  );

  const handleRemovedAccount = (accountId: string) => {
    dispatch(removeAccountThunk(accountId));
  };

  const sectionAnims = useRef(
    Array(5).fill(0).map(() => new Animated.Value(0))
  ).current;

 useFocusEffect(
  useCallback(() => {
    // reset animations
    sectionAnims.forEach(anim => anim.setValue(0));

    Animated.stagger(
      280,
      sectionAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 780,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();

    return () => {}; // cleanup not required
  }, [])
);

  const animatedStyle = (index) => ({
    opacity: sectionAnims[index],
    transform: [
      {
        translateY: sectionAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  return (
    <View style={[styles.container, theme === 'dark' ? {
      backgroundColor: 'black'
    } : {
      backgroundColor: 'white'
    }]}>
       
   <ScrollView
      style={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Notifications */}
      <Animated.View style={[styles.sectionContainer, animatedStyle(0)]}>
        <Text
          style={[
            styles.sectionTitle,
            theme === 'dark' && { backgroundColor: 'black', color: 'white' },
          ]}
        >
          {t('settings.notifications')}
        </Text>
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={settings.filter(item => item.id === '1' || item.id === '2')}
          renderItem={renderSettingItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </Animated.View>

      {/* Appearance */}
      <Animated.View style={[styles.sectionContainer, animatedStyle(1)]}>
        <Text
          style={[
            styles.sectionTitle,
            theme === 'dark' && { backgroundColor: 'black', color: 'white' },
          ]}
        >
          {t('settings.appearance')}
        </Text>
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={settings.filter(item => item.id === '3')}
          renderItem={renderSettingItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </Animated.View>

      {/* Security */}
      <Animated.View style={[styles.sectionContainer, animatedStyle(2)]}>
        <Text
          style={[
            styles.sectionTitle,
            theme === 'dark' && { backgroundColor: 'black', color: 'white' },
          ]}
        >
          {t('settings.security')}
        </Text>
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={settings.filter(item => item.id === '4' || item.id === '5')}
          renderItem={renderSettingItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </Animated.View>

      {/* General */}
      <Animated.View style={[styles.sectionContainer, animatedStyle(3)]}>
        <Text
          style={[
            styles.sectionTitle,
            theme === 'dark' && { backgroundColor: 'black', color: 'white' },
          ]}
        >
          {t('settings.general')}
        </Text>
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={settings.filter(item =>
            item.id === '6' || item.id === '7' || item.id === '8'
          )}
          renderItem={renderSettingItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </Animated.View>

      {/* Account */}
      <Animated.View style={[styles.sectionContainer, animatedStyle(4)]}>
        <Text
          style={[
            styles.sectionTitle,
            theme === 'dark' && { backgroundColor: 'black', color: 'white' },
          ]}
        >
          {t('settings.account')}
        </Text>
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={settings.filter(item => item.id === '9')}
          renderItem={renderSettingItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </Animated.View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
     <Modal
      visible={languageModalVisible}
      transparent
      animationType="none"
      onRequestClose={closeWithAnimation}
    >
      <Animated.View
        style={[
          languageStyles.modalOverlay,
          { opacity: overlayOpacity },
        ]}
      >
        <Animated.View
          style={[
            languageStyles.modalContent,
            theme === 'dark' && {
              backgroundColor: 'black',
              borderWidth: 1,
              borderColor: 'white',
            },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Header */}
          <View style={languageStyles.modalHeader}>
            <Text style={[languageStyles.modalTitle, theme === 'dark' && {
              color: 'white'
            }]}>
              {t('language.selectLanguage')}
            </Text>

            <TouchableOpacity onPress={closeWithAnimation}>
              <Text style={languageStyles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <FlatList
            data={languages}
            keyboardShouldPersistTaps="handled"
            renderItem={renderLanguageOption}
            keyExtractor={(_, index) => index.toString()}
            style={languageStyles.languageList}
          />
        </Animated.View>
      </Animated.View>
    </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setLogoutVisible(false);
          setAlertVisible(false);
        } }
        isBottomButtonVisible={logoutVisible}
        onCancel={() => {
          setLogoutVisible(false);
          setAlertVisible(false);
        } }
        onDone={async () => {
          if (logoutVisible) {
            const db = await getDBConnection();
            await createAccountsTable(db);

            const activeUser = await getActiveAccount(db);
            if (activeUser) {
              const newActiveUser = await logoutUser(db, activeUser?.id);

              if (newActiveUser) {
                if (isTokenValid(newActiveUser?.user?.tokenValidTill)) {
                  DevERPService.setToken(newActiveUser?.user?.token || '');
                  await AsyncStorage.setItem('erp_token', newActiveUser?.user?.token || '');
                  await AsyncStorage.setItem('auth_token', newActiveUser?.user?.token || '');
                  await AsyncStorage.setItem(
                    'erp_token_valid_till',
                    newActiveUser?.user?.token || ''
                  );

                  const validation = await validateCompanyCode(() => DevERPService.validateCompanyCode(newActiveUser?.user?.company_code)
                  );
                  if (!validation?.isValid) {
                    return;
                  }

                  dispatch(switchAccountThunk(newActiveUser?.id));
                } else {
                  const validation = await validateCompanyCode(() => DevERPService.validateCompanyCode(newActiveUser?.user?.company_code)
                  );
                  if (!validation?.isValid) {
                    return;
                  }

                  dispatch(switchAccountThunk(newActiveUser?.id));
                }
              } else {
                dispatch(setDashboard([]));
                dispatch(setEmptyMenu([]));
                dispatch(resetAjaxState());
                dispatch(resetAttendanceState());
                dispatch(clearAuthState());
                dispatch(resetDropdownState());
                dispatch(resetSyncLocationState());
                dispatch(resetAttendanceState());
                dispatch(logoutUserThunk());
              }
            }
          }
        } }
        cancelText={t('auth.cancel')}
        doneText={t('auth.logout')}
        color={ERP_COLOR_CODE.ERP_ERROR}
        actionLoader={undefined} closeHide={undefined}      />
    </View>
  );
};

const languageStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ERP_COLOR_CODE.ERP_222,
  },
  closeButton: {
    fontSize: 20,
    color: ERP_COLOR_CODE.ERP_999,
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: ERP_COLOR_CODE.ERP_f0f0f0,
  },
  selectedLanguage: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  languageName: {
    fontSize: 16,
    color: ERP_COLOR_CODE.ERP_333,
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: ERP_COLOR_CODE.ERP_APP_COLOR,
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
  },
});

export default SettingsScreen;

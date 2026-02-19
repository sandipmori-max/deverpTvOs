import React, { useLayoutEffect, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';

import AccountSwitcher from './components/AccountSwitcher';
import { styles } from './profile_style';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../../../store/hooks';
import { formatDateHr } from '../../../../utils/helpers';
import AddAccountScreen from '../../add_account/AddAccountScreen';
import ERPIcon from '../../../../components/icon/ERPIcon';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useBaseLink } from '../../../../hooks/useBaseLink';
import { useTranslation } from 'react-i18next';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import ProfileSection from './ProfileSection';
import TranslatedText from '../home/TranslatedText';

const ProfileTab = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, accounts } = useAppSelector(state => state?.auth);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const baseLink = useBaseLink();
  const theme = useAppSelector(state => state?.theme.mode);
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);

  const handleAddAccount = () => {
    setTapLoader(true)
    setTimeout(() => {
      setShowAccountSwitcher(false);
      setIsSwitchAccountOpen(true)
      setShowAddAccount(true);
    }, 600)
  };

  const activeAccount = accounts?.find(acc => acc?.user?.id === user?.id);

  // Animated values
  const profileAnim = useRef(new Animated.Value(0)).current;
  const accountAnim = useRef(new Animated.Value(0)).current;
  const [tapLoader, setTapLoader] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setTapLoader(false)
      return () => {
      };
    }, [navigation])
  );


  useFocusEffect(
    useCallback(() => {
      // Reset animation values
      profileAnim.setValue(0);
      accountAnim.setValue(0);

      // Animate both sections sequentially
      Animated.sequence([
        Animated.timing(profileAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(accountAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
      ]).start();

      return () => {
        // Optional cleanup
      };
    }, [showAccountSwitcher, showAddAccount])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
      
      },
      headerBackTitle: '',
      headerTintColor: '#fff',
      headerRight: () => (
        <>
          <ERPIcon
            isLoading={tapLoader}
            name="person-add-alt" onPress={() => {
              setTapLoader(true)
              setShowAccountSwitcher(false);
              setIsSwitchAccountOpen(false)
              setShowAddAccount(true);
            }} />
          <ERPIcon name="settings" onPress={() => navigation.navigate('Settings')} />
        </>
      ),
      headerLeft: () => (
        <ERPIcon extSize={24} isMenu={true} name="menu" onPress={() => navigation.openDrawer()} />
      ),
    });
  }, [navigation, theme, tapLoader]);

  return (
    <View
      style={[
        styles.container,
        theme === 'dark' && {
          backgroundColor: 'black',
        },
      ]}
    >
       
      <ScrollView
        style={[
          styles.scrollContainer,
          theme === 'dark' && {
            backgroundColor: 'black',
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          theme === 'dark' && {
            backgroundColor: 'black',
          },
        ]}
      >
        {/* Profile Card */}
        <Animated.View
          style={{
            opacity: profileAnim,
            transform: [
              {
                translateY: profileAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0], // slide up
                }),
              },
            ],
          }}
        >
          <ProfileSection
            user={user}
            baseLink={baseLink}
            onEditPress={() =>
              navigation.navigate('Page', {
                id: user?.id,
                title: t('profile.myProfile'),
                isFromNew: false,
                url: 'UserProfile',
                isFromProfile: true
              })
            }
          />
        </Animated.View>

        {/* Account Section */}
        <Animated.View
          style={{
            opacity: accountAnim,
            transform: [
              {
                translateY: accountAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={[
              styles.sectionContainer,
              theme === 'dark' && {
                borderWidth: 1,
                borderColor: 'white',
                borderRadius: 8,
                backgroundColor: 'black',
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                theme === 'dark' && {
                  backgroundColor: 'black',
                  color: 'white',
                  borderBottomWidth: 1,
                  borderBottomColor: 'white',
                },
              ]}
            >
              {t('profile.accountManagement')}
            </Text>

            <TouchableOpacity style={styles.settingCard} onPress={() => {
              setIsSwitchAccountOpen(true)
              setShowAccountSwitcher(true)
            }}>
              <View style={styles.settingHeader}>
                <View style={styles.settingIcon}>
                  <MaterialIcons
                    name={'group'}
                    color={theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_BLACK}
                    size={22}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text
                    style={[
                      styles.settingTitle,
                      theme === 'dark' && {
                        color: 'white',
                      },
                    ]}
                  >
                    {t('profile.manageAccounts')}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {accounts?.length} {t('profile.account')}
                    {accounts?.length !== 1 ? 's' : ''} {t('profile.available')}
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </TouchableOpacity>

            {activeAccount && (
              <View style={styles.settingCard}>
                <View style={[styles.settingHeader]}>
                  <View style={styles.settingIcon}>
                    <MaterialIcons
                      name={'access-time'}
                      color={theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_BLACK}
                      size={22}
                    />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text
                      style={[
                        styles.settingTitle,
                        theme === 'dark' && {
                          color: 'white',
                        },
                      ]}
                    >
                      {t('profile.lastLogin')}
                    </Text>
                    <TranslatedText
                    numberOfLines={1}
                    text={formatDateHr(activeAccount?.lastLoginAt, false)}
                    style={styles.settingSubtitle}>
                     
                    </TranslatedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
{
  showAccountSwitcher &&   <AccountSwitcher
        visible={showAccountSwitcher}
        onClose={() => {
          setTapLoader(false)
          setShowAccountSwitcher(false)
        }}
        onAddAccount={handleAddAccount}
        tapLoader={tapLoader}
        setShowAccountSwitcher={setShowAccountSwitcher}
      />
}
    

{
  showAddAccount &&  <AddAccountScreen
        visible={showAddAccount}
        onClose={() => {
          setTapLoader(false)
          
        }}
        setIsSwitchAccountOpen={setIsSwitchAccountOpen}
        setShowAddAccount={setShowAddAccount}
        setShowAccountSwitcher={setShowAccountSwitcher}
         isSwitchAccountOpen={isSwitchAccountOpen}
      />

}
     
    </View>
  );
};

export default ProfileTab;

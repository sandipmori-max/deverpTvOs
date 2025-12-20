import React, { useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import AccountSwitcher from './components/AccountSwitcher';
import { styles } from './profile_style';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../../../store/hooks';
import { firstLetterUpperCase, formatDateHr } from '../../../../utils/helpers';
import AddAccountScreen from '../../add_account/AddAccountScreen';
import ERPIcon from '../../../../components/icon/ERPIcon';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import FastImage from 'react-native-fast-image';
import { useBaseLink } from '../../../../hooks/useBaseLink';
import { useTranslation } from 'react-i18next';
import { ERP_COLOR_CODE } from '../../../../utils/constants';

const ProfileTab = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, accounts } = useAppSelector(state => state?.auth);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const baseLink = useBaseLink();

  console.log("user-------------------------", user)
  const handleAddAccount = () => {
    setShowAccountSwitcher(false);
    setShowAddAccount(true);
  };

  const activeAccount = accounts?.find(acc => acc?.user?.id === user?.id);

  useLayoutEffect(() => {
    navigation.setOptions({
          headerStyle: {
            height: 45,
            backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR, // 👈 header bg color
          },
      headerRight: () => (
        <>
          <ERPIcon
            name="person-add-alt"
            onPress={() => {
              handleAddAccount();
            }}
          />
          <ERPIcon
            name="settings"
            onPress={() => {
              navigation.navigate('Settings');
            }}
          />
        </>
      ), 
    });
  }, [navigation]);
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{
          width:'100%',
          flexDirection:'row',
          justifyContent:'space-between'
        }}>
          <View style={{ width: '50%' }}>
  {user && (
    <TouchableOpacity style={styles.profileCard}>
      <View style={styles.profileHeader}>
        
        {/* Avatar */}
        <FastImage
          source={{ uri: user.avatar }}
          style={styles.avatar}
        />

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user.username}
          </Text>

          <Text style={styles.profileCompany}>
            {user.companyName}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.badgeText}>
                {user.rolename}
              </Text>
            </View>

            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {user.accountType.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  )}
</View>

          <View style={{width:'50%', marginTop: 16}}>

             <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('profile.accountManagement')}</Text>
          <TouchableOpacity style={styles.settingCard} onPress={() => setShowAccountSwitcher(true)}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIcon}>
                <MaterialIcons name={'group'} color={ERP_COLOR_CODE.ERP_BLACK} size={22} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.manageAccounts')}</Text>
                <Text style={styles.settingSubtitle}>
                  {accounts?.length} {t('profile.account')}
                  {accounts?.length !== 1 ? 's' : ''} {t('profile.available')}
                </Text>
              </View>
              <Text style={styles.arrowIcon}>›</Text>
            </View>
          </TouchableOpacity>

          {activeAccount && (
            <View style={[styles.settingCard]}>
              <View style={styles.settingHeader}>
                <View style={styles.settingIcon}>
                  <MaterialIcons name={'access-time'} color={ERP_COLOR_CODE.ERP_BLACK} size={22} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{t('profile.lastLogin')}</Text>
                  <Text style={styles.settingSubtitle}>
                    {formatDateHr(activeAccount?.lastLoginAt, false)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        </View>

        </View>
        {/* Profile Card */}
       

        {/* Account Section */}
       

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <AccountSwitcher
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
        onAddAccount={handleAddAccount}
      />

      <AddAccountScreen visible={showAddAccount} onClose={() => setShowAddAccount(false)} />
    </View>
  );
};

export default ProfileTab;

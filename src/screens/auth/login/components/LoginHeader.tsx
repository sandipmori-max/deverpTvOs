import React, { useEffect, useRef } from 'react';
import { Image, Text, Animated } from 'react-native';
import { styles } from '../login_style';
import { ERP_ICON } from '../../../../assets';

const LoginHeader = ({
  isAddingAccount,
  t,
}: {
  isAddingAccount: boolean;
  t: any;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current; 
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isAddingAccount]); 

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <Image
        source={ERP_ICON.APP_LOGO}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        {isAddingAccount
          ? t('auth.addAccount')
          : t('auth.welcomeDevERP')}
      </Text>

      <Text style={styles.subtitle}>
        {isAddingAccount
          ? t('auth.signInToAddAccount')
          : t('auth.signInToAccount')}
      </Text>
    </Animated.View>
  );
};

export default LoginHeader;

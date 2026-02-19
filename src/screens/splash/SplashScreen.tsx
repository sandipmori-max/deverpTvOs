import React, { useEffect, useRef } from 'react';
import { View, Image, StatusBar, Animated, Easing } from 'react-native';

import { ERP_ICON } from '../../assets';
import { styles } from './splash_style';
import { SplashProps } from './types';
import { useAppSelector } from '../../store/hooks';
import { DARK_COLOR } from '../../utils/constants';
import useTranslations from '../../hooks/useTranslations';
import { firstLetterUpperCase } from '../../utils/helpers';

const CustomSplashScreen: React.FC<SplashProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const theme = useAppSelector(state => state?.theme.mode);
  const { t } = useTranslations();
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 800,
            delay: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, textTranslateY, subtitleOpacity, onFinish]);

  return (
    <View style={[styles.container, theme === 'dark' && {
      backgroundColor: '#000'
    }]}>
      <StatusBar hidden />
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
          theme === 'dark' && {
            backgroundColor: '#000'
          }
        ]}
      >
        <Image source={ERP_ICON.APP_LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      {
        user?.name &&  <Animated.Text
        style={[
          styles.helloTitle,
          {
            transform: [{ translateY: textTranslateY }],
          },
          theme === 'dark' && {
            color: 'white'
          }
        ]}
      >
        {t('text99')}, {firstLetterUpperCase(user?.name || '')} 
      </Animated.Text>
      }
     
      <Animated.Text
        style={[
          styles.title,
          {
            transform: [{ translateY: textTranslateY }],
          },
          theme === 'dark' && {
            color: 'white'
          }
        ]}
      >
        {t("text.text53")}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleOpacity,
          },
          theme === 'dark' && {
            color: 'white'
          }
        ]}
      >
        {t('text.text54')}
      </Animated.Text>
    </View>
  );
};

export default CustomSplashScreen;

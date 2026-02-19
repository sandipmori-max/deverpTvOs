import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

import { styles } from './nointernet_style';
import useTranslations from '../../hooks/useTranslations';
import { ERP_GIF } from '../../assets';
import FastImage from 'react-native-fast-image';
import { NoInterNetProps } from './types';

const NoInternetScreen: React.FC<NoInterNetProps> = ({ onRetry }) => {
  const { t } = useTranslations();

  const imageScale = useRef(new Animated.Value(0.8)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const titleAnim = useRef(new Animated.Value(30)).current;
  const subtitleAnim = useRef(new Animated.Value(30)).current;
  const buttonAnim = useRef(new Animated.Value(30)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
 const scaleAnim = useRef(new Animated.Value(1)).current;

const onPressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.95,
    useNativeDriver: true,
  }).start();
};

const onPressOut = () => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    friction: 4,
    tension: 220,
    useNativeDriver: true,
  }).start();
};
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(titleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(subtitleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* GIF */}
      <Animated.View
        style={{
          opacity: imageOpacity,
          transform: [{ scale: imageScale }],
        }}
      >
        <FastImage
          source={ERP_GIF.NO_INTERNET}
          style={styles.gif}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleAnim }],
          },
        ]}
      >
        {t('errors.noInternet')}
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleAnim }],
          },
        ]}
      >
        {t('errors.somethingWentWrong')}
      </Animated.Text>

      {/* Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.button}
    onPress={onRetry}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
  >
    <Text style={styles.buttonText}>{t('errors.tryAgain')}</Text>
  </TouchableOpacity>
</Animated.View>
    </View>
  );
};

export default NoInternetScreen;

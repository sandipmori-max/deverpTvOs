import { View, Text, Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';
import FastImage from 'react-native-fast-image';

import { ERP_GIF } from '../../assets';
import { styles } from './loader_style';
import { useAppSelector } from '../../store/hooks';
import { useTranslation } from 'react-i18next';
import { ERP_COLOR_CODE } from '../../utils/constants';

const FullViewLoader = ({isShowTop = true}) => {
  const {t} = useTranslation()
  const theme = useAppSelector(state => state?.theme.mode);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Text animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Loader pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (

    <>
        
       <View
      style={[
        styles.loadingContainer,
        theme === 'dark' && { backgroundColor: 'black' },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <FastImage
          source={ERP_GIF.LOADING}
          style={styles.gif}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
            color: theme === 'dark' ? '#fff' : '#000',
          },
        ]}
      >
        {t('test6')}
      </Animated.Text>

      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: fadeAnim,
            color: theme === 'dark' ? '#aaa' : '#555',
          },
        ]}
      >
        {t('test7')}
      </Animated.Text>
    </View>
    </>
 
  );
};

export default FullViewLoader;

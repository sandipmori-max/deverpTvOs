import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, Image, Animated, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ERP_GIF, ERP_ICON } from '../../assets';
import { styles } from './error_style';
import { ErrorMessageProps } from '../types';
import { useAppSelector } from '../../store/hooks';
import { ERP_COLOR_CODE } from '../../utils/constants';

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, visible = true , isShowTop = true}) => {
  const theme = useAppSelector(state => state?.theme.mode);

  const opacity = useRef(new Animated.Value(0)).current;
  const imageTranslateX = useRef(new Animated.Value(-15)).current;
  const textTranslateX = useRef(new Animated.Value(15)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      imageTranslateX.setValue(-150);
      textTranslateX.setValue(150);

      return () => {
        setShouldRender(false);
      };
    }, [])
  );

  // 🎬 Animate on visible/message change
  useEffect(() => {
    if (visible && message) {
      setShouldRender(true);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(imageTranslateX, {
          toValue: 0,
          duration: 460,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateX, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(imageTranslateX, {
          toValue: -150,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateX, {
          toValue: 105,
          duration: 550,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, message]);

  if (!shouldRender) return null;

  return (
  <>
 
  
    <Animated.View
      style={[
        styles.container,
        theme === 'dark' && { backgroundColor: 'black' },
        { opacity },
      ]}
    >
      <Animated.Image
        source={ERP_ICON.ERROR_ICON}
        style={[
          styles.errorImage,
          { transform: [{ translateX: imageTranslateX }] },
        ]}
      />
      <Animated.Text
        style={[
          styles.errorText,
          { transform: [{ translateX: textTranslateX }] },
        ]}
      >
        {message}
      </Animated.Text>
    </Animated.View>
  </>
  );
};

export default ErrorMessage;

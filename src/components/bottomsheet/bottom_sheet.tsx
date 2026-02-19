import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import { BottomSheetProps } from './type';
import { styles } from './bottomsheet_style';

const { height: screenHeight } = Dimensions.get('window');

const BottomSheet = ({ visible, onClose, children, heightRatio = 0.6 }: BottomSheetProps) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [contentHeight, setContentHeight] = useState(screenHeight * heightRatio);

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: screenHeight - contentHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, contentHeight]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { opacity: visible ? 0.5 : 0 }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setContentHeight(Math.min(h, screenHeight * heightRatio));
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

export default BottomSheet;

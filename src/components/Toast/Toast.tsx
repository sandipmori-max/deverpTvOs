import React, { useRef, useEffect } from 'react';
import {
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ERP_COLOR_CODE } from '../../utils/constants';
import { useAppSelector } from '../../store/hooks';
import TranslatedText from '../../screens/dashboard/tabs/home/TranslatedText';

const { width } = Dimensions.get('window');

const Toast = ({ visible, message, onHide , tbackgroundColor}: { visible: boolean; message: string; onHide: () => void , tbackgroundColor: any}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const theme = useAppSelector(state => state.theme.mode);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(onHide);
        }, 900);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        theme === 'dark' && {
          backgroundColor: "white",
        },
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
        {
          backgroundColor: tbackgroundColor ? tbackgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR
        }
      ]}
    >
      <TranslatedText
      text={message}
      numberOfLines={1}
      style={[
        styles.toastText,
        theme === 'dark' && { color: 'black' }
      ]}>
        
      </TranslatedText>
    </Animated.View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    width: width ,
  },
  toastText: {
    color: ERP_COLOR_CODE.ERP_BLACK,
    fontSize: 16,
    textAlign: 'center',
  },
});

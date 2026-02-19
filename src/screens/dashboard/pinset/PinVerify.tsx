import MaterialIcons from '@react-native-vector-icons/material-icons';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  NativeModules,
  Easing,
  ImageBackground,
} from 'react-native';
import { ERP_COLOR_CODE } from '../../../utils/constants';
import { getDBConnection, getPinCode } from '../../../utils/sqlite';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomAlert from '../../../components/alert/CustomAlert';
import { useAppDispatch } from '../../../store/hooks';
import { updatePinVerifyLoadedState } from '../../../store/slices/auth/authSlice';
import { ERP_GIF } from '../../../assets';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('screen');

const PinVerifyScreen = () => {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const [pin, setPin] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
  });

  const navigation = useNavigation<any>();

  // Each key has its own scale value
  const keyScales = useRef<{ [key: string]: Animated.Value }>({}).current;

  const getScale = (key: string) => {
    if (!keyScales[key]) keyScales[key] = new Animated.Value(1);
    return keyScales[key];
  };

  const animateKey = (key: string) => {
    const scale = getScale(key);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Optional: sound function (requires native setup)
  const playTapSound = () => {
    if (Platform.OS === 'ios') {
      const { AudioServices } = NativeModules;
      AudioServices?.playSystemSound?.(1104);
    } else if (Platform.OS === 'android') {
      const { SoundModule } = NativeModules;
      SoundModule?.playTap?.();
    }
  };

  const handleKeyPress = (digit: string) => {
    if (!isBlocked && pin.length < 4) {
      setPin(pin + digit);
      animateKey(digit);
      playTapSound();
    }
  };

  const handleDelete = () => {
    if (!isBlocked) {
      setPin(pin.slice(0, -1));
      animateKey('del');
      playTapSound();
    }
  };

  const blockUser = () => {
    setIsBlocked(true);
    setCountdown(60);
    setAttempts(0);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBlocked(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyPin = async () => {
    if (isBlocked) return;

    if (pin.length < 4) {
      setAlertVisible(true);
      setAlertConfig({
        title: t('text74'),
        message: t('text75'),
        type: 'error',
      });
      return;
    }

    try {
      const db = await getDBConnection();
      const savedPin = await getPinCode(db);

      if (savedPin === pin) {
        dispatch(updatePinVerifyLoadedState(true))
        navigation.replace('Drawer');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        setAlertVisible(true);
        setAlertConfig({
          title: t('text76'),
          message: t('text77'),
          type: 'error',
        });
        setPin('');

        animateKey('ok'); // optional animation on wrong OK press

        if (newAttempts >= 3) {
          blockUser();
        }
      }
    } catch (error) {
      setAlertVisible(true);
      setAlertConfig({
        title: t('text78'),
        message: error?.toString() || '',
        type: 'error',
      });
    }
  };

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['del', '0', 'ok'],
  ];

  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  const pinAnims = useRef(
    Array(4).fill(0).map(() => new Animated.Value(0))
  ).current;

  const pinPulseAnims = useRef(
    Array(4).fill(0).map(() => new Animated.Value(0))
  ).current;

  const keyAnims = useRef(
    Array(12).fill(0).map(() => new Animated.Value(0))
  ).current;

  const keyPulseAnims = useRef(
    Array(12).fill(0).map(() => new Animated.Value(0))
  ).current;

  /** ---------------- Screen load animation ---------------- */
  useFocusEffect(
    useCallback(() => {
      titleAnim.setValue(0);
      subtitleAnim.setValue(0);
      pinAnims.forEach(a => a.setValue(0));
      keyAnims.forEach(a => a.setValue(0));

      Animated.sequence([
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.stagger(
            60,
            pinAnims.map(anim =>
              Animated.spring(anim, {
                toValue: 1,
                damping: 14,
                stiffness: 160,
                useNativeDriver: true,
              })
            )
          ),
          Animated.sequence([
            Animated.delay(120),
            Animated.stagger(
              40,
              keyAnims.map(anim =>
                Animated.timing(anim, {
                  toValue: 1,
                  duration: 220,
                  easing: Easing.out(Easing.ease),
                  useNativeDriver: true,
                })
              )
            ),
          ]),
        ]),
      ]).start();
    }, [])
  );

  /** ---------------- PIN dot pulse ---------------- */
  useEffect(() => {
    if (pin.length === 0 || pin.length > 4) return;

    const index = pin.length - 1;
    pinPulseAnims[index].setValue(0);

    Animated.sequence([
      Animated.timing(pinPulseAnims[index], {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pinPulseAnims[index], {
        toValue: 0,
        duration: 700,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [pin.length]);

  /** ---------------- Key press pulse ---------------- */
  const triggerKeyPulse = (index) => {
    keyPulseAnims[index].setValue(0);

    Animated.sequence([
      Animated.timing(keyPulseAnims[index], {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(keyPulseAnims[index], {
        toValue: 0,
        duration: 820,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };


  return (
    
   <View >
      
       <ImageBackground
              source={ERP_GIF.BACK_IMG}
              style={styles.container}
              resizeMode='cover'
            >

      {/* Header */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleAnim,
            transform: [
              {
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
       {t('text79')}
      </Animated.Text>

      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleAnim,
            transform: [
              {
                translateY: subtitleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-6, 0],
                }),
              },
            ],
          },
        ]}
      >
        {t('text80')}
      </Animated.Text>

      {/* Countdown if blocked */}
      {isBlocked && (
        <View style={{flexDirection:'row'}}>
          <Text
          style={{
            fontSize: 16,
            marginBottom: 20,
            paddingHorizontal: 30,
            textAlign: 'center',
          }}
        >
          {t('text81')}{'\n'}{t('text82')} <Text  style={{
            fontSize: 18,
            marginBottom: 20,
            paddingHorizontal: 30,
            textAlign: 'center',
            color: ERP_COLOR_CODE.ERP_ERROR
          }}>{countdown}</Text> seconds
        </Text>
        </View>
      )}

      {/* PIN Circles */}
      <View style={styles.pinRow}>
        {[0, 1, 2, 3].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.pinCircle,
              {
                backgroundColor:
                  i < pin.length
                    ? ERP_COLOR_CODE.ERP_APP_COLOR
                    : '#e5e7eb',
                opacity: pinAnims[i],
                transform: [
                  {
                    scale: Animated.multiply(
                      pinAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 1],
                      }),
                      pinPulseAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.25],
                      })
                    ),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {keypadRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, colIndex) => {
              const keyIndex = rowIndex * 3 + colIndex;

              return (
                <Animated.View
                  key={key}
                  style={{
                    opacity: keyAnims[keyIndex],
                    transform: [
                      {
                        scale: Animated.multiply(
                          keyAnims[keyIndex].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.85, 1],
                          }),
                          keyPulseAnims[keyIndex].interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          })
                        ),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={styles.key}
                    onPress={() => {
                      if (isBlocked) return;

                      triggerKeyPulse(keyIndex);

                      if (key === 'del') handleDelete();
                      else if (key === 'ok') handleVerifyPin();
                      else handleKeyPress(key);
                    }}
                  >
                    {key === 'del' ? (
                      <MaterialIcons name="backspace" size={28} color="#374151" />
                    ) : key === 'ok' ? (
                      <MaterialIcons
                        name="check-circle"
                        size={36}
                        color={pin.length === 4 ? '#16a34a' : '#9ca3af'}
                      />
                    ) : (
                      <Text style={styles.keyText}>{key}</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>

      <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertVisible(false)}
          actionLoader={undefined} closeHide={undefined}      />
            </ImageBackground>

    </View>
 
  );
};

const styles = StyleSheet.create({
  container: {
    height: Dimensions.get('screen').height,
    width:Dimensions.get('screen').width,
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 40,
  },
  pinRow: {
    flexDirection: 'row',
    marginBottom: 50,
  },
  pinCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginHorizontal: 8,
    borderWidth: 1
  },
  keypad: {
    width: width * 0.8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
  },
});

export default PinVerifyScreen;

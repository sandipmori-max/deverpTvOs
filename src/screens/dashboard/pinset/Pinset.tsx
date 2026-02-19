import MaterialIcons from '@react-native-vector-icons/material-icons';
import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLOR, ERP_COLOR_CODE } from '../../../utils/constants';
import {
  getDBConnection,
  setPinCode,
  setPinEnabled,
  isPinEnabled,
  getPinCode,
  removePinCode,
  resetPin,
} from '../../../utils/sqlite';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomAlert from '../../../components/alert/CustomAlert';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setIsPinLoaded } from '../../../store/slices/auth/authSlice';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('screen');

// AsyncStorage keys for attempts/block
const AS_KEYS = {
  WRONG_ATTEMPTS: 'erp_pin_wrong_attempts',
  BLOCK_UNTIL: 'erp_pin_block_until',
};

const PinSetupScreen = () => {
  const {t} = useTranslation()
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme.mode);
  const [menuVisible, setMenuVisible] = useState(false);

  // PIN visual & stored
  const [pin, setPin] = useState<string>('');
  const [storedPin, setStoredPin] = useState<string>('');

  const [screen, setScreen] = useState<'verify' | 'setup' | 'confirm' | 'change_verify' | 'change_setup' | 'change_confirm' | 'remove_verify' | 'remove_confirm' | 'forgot_setup' | 'forgot_confirm' | 'blocked' | 'menu'>('menu');

  // temporary PIN holder for confirm flows
  const tempPinRef = useRef<string>('');
  const [renderMenu, setRenderMenu] = useState(false);

  // alerts
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
  });

  // attempts / block
  const [attempts, setAttempts] = useState<number>(0);
  const [blockUntil, setBlockUntil] = useState<number>(0);
  const [blockedLeft, setBlockedLeft] = useState(0);

  // load initial PIN + attempts + decide initial screen
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const db = await getDBConnection();
        const enabled = await isPinEnabled(db);
        if (enabled) {
          const oldPin = await getPinCode(db);
          setStoredPin(oldPin || '');
          setScreen('verify');
        } else {
          setScreen('setup');
        }
      } catch (error) {
      }

      try {
        const attemptsStr = await AsyncStorage.getItem(AS_KEYS.WRONG_ATTEMPTS);
        const blockStr = await AsyncStorage.getItem(AS_KEYS.BLOCK_UNTIL);
        const a = attemptsStr ? Number(attemptsStr) : 0;
        const b = blockStr ? Number(blockStr) : 0;
        setAttempts(a);
        setBlockUntil(b);

        // if blocked and still within time -> set screen blocked
        if (b && Date.now() < b) {
          setScreen('blocked');
        }
      } catch (e) {
      }
    };
    bootstrap();
  }, []);
  useEffect(() => {
    if (screen !== 'blocked') return;

    const interval = setInterval(() => {
      if (!blockUntil) return;

      const left = Math.max(0, Math.ceil((blockUntil - Date.now()) / 1000));
      setBlockedLeft(left);

      if (left <= 0) {
        clearInterval(interval);
        // unblock automatically
        resetAttemptsAndBlock();
        setScreen(storedPin ? 'verify' : 'setup');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, blockUntil]);

  // header style kept as your original
  

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
      },
      headerBackTitle: '',
      headerTintColor: '#fff',
      headerTitle: () => (
        <Text
          numberOfLines={1}
          style={{
            maxWidth: 180,
            fontSize: 18,
            fontWeight: '700',
            color: theme === 'dark' ? "white" : ERP_COLOR_CODE.ERP_WHITE,
          }}
        >
          {t('text32')}
        </Text>
      ),

      // ⭐ NEW — 3-dot menu icon
      headerRight: () => (
        <>
          {
            screen !== 'blocked' && <TouchableOpacity
              style={{ paddingHorizontal: 12 }}
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <MaterialIcons name={menuVisible ? 'close' : "more-vert"} size={28} color="white" />
            </TouchableOpacity>
          }

        </>
      ),
    });
  }, [navigation, theme, menuVisible, screen]);


  // helper: persist attempts & block
  const persistAttempts = async (count: number) => {
    setAttempts(count);
    try {
      await AsyncStorage.setItem(AS_KEYS.WRONG_ATTEMPTS, String(count));
    } catch (e) { console.warn('persistAttempts err', e); }
  };

  const persistBlockUntil = async (ts: number) => {
    setBlockUntil(ts);
    try {
      await AsyncStorage.setItem(AS_KEYS.BLOCK_UNTIL, String(ts));
    } catch (e) { console.warn('persistBlockUntil err', e); }
  };

  const resetAttemptsAndBlock = async () => {
    setAttempts(0);
    setBlockUntil(0);
    try {
      await AsyncStorage.removeItem(AS_KEYS.WRONG_ATTEMPTS);
      await AsyncStorage.removeItem(AS_KEYS.BLOCK_UNTIL);
    } catch (e) { console.warn('resetAttemptsAndBlock err', e); }
  };

  // PIN input handlers (keep existing keypad)
  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) setPin(pin + digit);
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  // helper: show alert using CustomAlert
  const showAlert = (title: string, message: string, type: 'error' | 'info' | 'success' = 'info', autoCloseMs?: number) => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
    if (autoCloseMs) {
      setTimeout(() => setAlertVisible(false), autoCloseMs);
    }
  };

  // check blocked state
  const isBlocked = () => {
    if (blockUntil && Date.now() < blockUntil) return true;
    return false;
  };

  // common verification failure handler (increments attempts, possible block)
  const handleWrongPin = async () => {
    const newAttempts = attempts + 1;
    await persistAttempts(newAttempts);

    if (newAttempts >= 3) {
      const until = Date.now() + 5 * 60 * 1000; // 5 minutes
      await persistBlockUntil(until);
      setScreen('blocked');
      showAlert(t('text37'), t('text73'), 'error');
    } else {
      showAlert(
        t('text71'),
        `${t("text72")}${newAttempts} of 3.`,
        'error',
        35000
      );

    }
  };

  // When user confirms Remove PIN (after verification), call DB to remove
  const performRemovePin = async () => {
    try {
      const db = await getDBConnection();
      await resetPin(db);        // resets PIN meta + disables flag
      await removePinCode(db);  // remove code if exists
      await resetAttemptsAndBlock();

      showAlert(t('text61'), t('text70'), 'success', 1800);

      // update store and navigate back (same as original remove flow)
      dispatch(setIsPinLoaded());
      setTimeout(() => {
        setAlertVisible(false);
        navigation.goBack();
      }, 1800);
    } catch (err) {
      showAlert(t('text66'), t('text69'), 'error');
    }
  };

  // When user finishes setting a new PIN (setup or change or forgot)
  const performSavePin = async (finalPin: string, navigateBack = true) => {
    try {
      const db = await getDBConnection();
      await setPinCode(db, finalPin);
      await setPinEnabled(db, true);
      await resetAttemptsAndBlock();

      showAlert(t('text61'), t('text68'), 'success', 1800);
      dispatch(setIsPinLoaded());

      // update local storedPin and maybe go back
      setStoredPin(finalPin);
      setPin('');

      if (navigateBack) {
        setTimeout(() => {
          setAlertVisible(false);
          navigation.goBack();
        }, 1800);
      } else {
        // keep in-screen if you want (we'll go to menu)
        setScreen('menu');
      }
    } catch (error) {
      showAlert(t('text66'), t('text67'), 'error');
    }
  };

  // core OK button behavior — responds based on current screen
  const handleOk = async () => {
    // blocked check
    if (isBlocked()) {
      const leftSec = Math.ceil((blockUntil - Date.now()) / 1000);
      showAlert(t('text64'), `${t('text65')} ${leftSec} seconds`, 'error');
      setPin('');
      return;
    }

    if (pin.length !== 4) return; // ignore if not complete

    // ---------- INITIAL VERIFY (existing behavior) ----------
    if (screen === 'verify') {
      if (pin === storedPin) {
        await resetAttemptsAndBlock();
        showAlert(t('text60'), t('text63'), 'success', 1800);
        setPin('');
        setScreen('setup');
      } else {
        await handleWrongPin();
        setPin('');
      }
      return;
    }

    // ---------- SETUP (new PIN) ----------
    if (screen === 'setup') {
      // save to temp and go to confirm
      tempPinRef.current = pin;
      setPin('');
      setScreen('confirm');
      return;
    }
    if (screen === 'confirm') {
      if (pin === tempPinRef.current) {
        await performSavePin(pin, true); // navigate back as original did
      } else {
        showAlert(t('text59'), t('text60'), 'error');
        tempPinRef.current = '';
        setPin('');
        setScreen('setup');
      }
      return;
    }

    // ---------- CHANGE PIN flow ----------
    if (screen === 'change_verify') {
      if (pin === storedPin) {
        await resetAttemptsAndBlock();
        setPin('');
        setScreen('change_setup');
        showAlert(t('text61'), t('text63'), 'success', 1800);
      } else {
        await handleWrongPin();
        setPin('');
      }
      return;
    }
    if (screen === 'change_setup') {
      tempPinRef.current = pin;
      setPin('');
      setScreen('change_confirm');
      return;
    }
    if (screen === 'change_confirm') {
      if (pin === tempPinRef.current) {
        await performSavePin(pin, true); // save and go back
      } else {
        showAlert(t('text59'), t('text60'), 'error');
        tempPinRef.current = '';
        setPin('');
        setScreen('change_setup');
      }
      return;
    }

    // ---------- REMOVE PIN flow ----------
    if (screen === 'remove_verify') {
      if (pin === storedPin) {
        await resetAttemptsAndBlock();
        setPin('');
        setScreen('remove_confirm');
        showAlert(t('text61'), t('text62'), 'success', 1800);
      } else {
        await handleWrongPin();
        setPin('');
      }
      return;
    }

    if (screen === 'remove_confirm') {
      // final remove
      await performRemovePin();
      return;
    }

    // ---------- FORGOT PIN flow (allow user to reset without old PIN after a prompt) ----------
    if (screen === 'forgot_setup') {
      tempPinRef.current = pin;
      setPin('');
      setScreen('forgot_confirm');
      return;
    }
    if (screen === 'forgot_confirm') {
      if (pin === tempPinRef.current) {
        // save new PIN
        await performSavePin(pin, true);
      } else {
        showAlert(t('text59'), t('text60'), 'error');
        tempPinRef.current = '';
        setPin('');
        setScreen('forgot_setup');
      }
      return;
    }

    // fallback: do nothing
  };

  // remove button pressed initially: we ask to verify before removal (preserve security)
  const onRemovePinPress = () => {
    if (!storedPin) {
      showAlert(t('text57'), t('text58'), 'error');
      return;
    }
    setScreen('remove_verify');
    setPin('');
  };

  const onChangePinPress = () => {
    if (!storedPin) {
      setScreen('setup');
      setPin('');
      return;
    }
    setScreen('change_verify');
    setPin('');
  };

  // Small helper to show status text under title
  const renderSubtitle = () => {
    if (screen === 'verify') return t('text56');
    if (screen === 'setup') return t('text55');
    if (screen === 'confirm') return t('text54');
    if (screen === 'change_verify') return t('text53');
    if (screen === 'change_setup') return t('text49');
    if (screen === 'change_confirm') return t('text52');
    if (screen === 'remove_verify') return t('text51');
    if (screen === 'remove_confirm') return t('text50');
    if (screen === 'forgot_setup') return t('text49');
    if (screen === 'forgot_confirm') return t('text45');
    if (screen === 'blocked') {
      return `${t('text48')} ${blockedLeft} sec`;
    }

    return '';
  };

  const screenAnim = useRef(new Animated.Value(0)).current;

  // Menu animation
  const menuAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const pinPulseAnims = useRef(
    Array(4).fill(0).map(() => new Animated.Value(0))
  ).current;
  const keyPulseAnims = useRef(
    Array(12).fill(0).map(() => new Animated.Value(0))
  ).current;

  const pinAnims = useRef(
    Array(4).fill(0).map(() => new Animated.Value(0))
  ).current;

  const keyAnims = useRef(
    Array(12).fill(0).map(() => new Animated.Value(0))
  ).current;
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
        duration: 700, // total ~1 sec
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [pin.length]);

  // Screen load animation
  useFocusEffect(
    useCallback(() => {
      screenAnim.setValue(0);
      Animated.timing(
        screenAnim,
        {
          toValue: 1, duration: 2500,
          easing: Easing.out(Easing.cubic)
          , useNativeDriver: true,
        }).start();
    }, []));

  // Menu open animation
  useFocusEffect(
    useCallback(() => {
      if (menuVisible) {
        // OPEN
        setRenderMenu(true);
        menuAnim.setValue(0);

        Animated.timing(menuAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else if (renderMenu) {
        // CLOSE
        Animated.timing(menuAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setRenderMenu(false); // unmount after animation
        });
      }
    }, [menuVisible])
  );

  useFocusEffect(
    useCallback(() => {
      titleAnim.setValue(0);
      subtitleAnim.setValue(0);
      pinAnims.forEach(a => a.setValue(0));
      keyAnims.forEach(a => a.setValue(0));

      Animated.sequence([
        // Title
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // Subtitle
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // PIN + KEYS together (FIX)
        Animated.parallel([
          // PIN circles
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

          // Keypad (starts shortly after PIN begins)
          Animated.sequence([
            Animated.delay(150), // 👈 small delay only
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
        duration: 820, // total ~1 sec
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (

    <>
     
    <Animated.View
      style={[
        styles.container,
        theme === 'dark' && { backgroundColor: 'black' },
        {
          opacity: screenAnim,
          transform: [
            {
              scale: screenAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.97, 1],
              }),
            },
          ],
        },
      ]}
    >
            
      {/* Header */}
      <Animated.Text
        style={[
          styles.title,
          theme === 'dark' && { color: 'white' },
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
        {(() => {
          if (screen === 'verify') return t('text47');
          if (screen === 'setup') return t('text46');
          if (screen === 'confirm') return t('text45');
          if (screen === 'change_verify') return t('text44');
          if (screen === 'change_setup') return t('text43');
          if (screen === 'change_confirm') return t('text42');
          if (screen === 'remove_verify') return t('text41');
          if (screen === 'remove_confirm') return t('text40');
          if (screen === 'forgot_setup') return t('text39');
          if (screen === 'forgot_confirm') return t('text38');
          if (screen === 'blocked') return t('text37');
          return storedPin ? t('text35') : t('text36');
        })()}
      </Animated.Text>


      <Animated.Text
        style={[
          styles.subtitle,
          theme === 'dark' && { color: 'white' },
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
        {renderSubtitle()}
      </Animated.Text>


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
                    ? theme === 'dark'
                      ? 'white'
                      : ERP_COLOR_CODE.ERP_APP_COLOR
                    : theme === 'dark'
                      ? DARK_COLOR
                      : '#e5e7eb',

                transform: [
                  // Screen-load scale
                  {
                    scale: Animated.multiply(
                      pinAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 1],
                      }),
                      // Highlight pulse
                      pinPulseAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.25],
                      })
                    ),
                  },
                ],
                opacity: pinAnims[i],
              },
            ]}
          />
        ))}
      </View>



      {/* Keypad */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['del', '0', 'ok'],
        ].flat().map((key, index) => {
          const rowIndex = Math.floor(index / 3);
          const colIndex = index % 3;

          return (
            colIndex === 0 && (
              <View key={rowIndex} style={styles.keypadRow}>
                {[0, 1, 2].map(offset => {
                  const keyIndex = rowIndex * 3 + offset;
                  const item = [
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['del', '0', 'ok'],
                  ][rowIndex][offset];

                  return (
                    <Animated.View
                      key={item}
                      style={{
                        opacity: keyAnims[keyIndex],
                        transform: [
                          {
                            scale: Animated.multiply(
                              // Screen load animation
                              keyAnims[keyIndex].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.85, 1],
                              }),
                              // Press pulse animation
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
                        style={[styles.key, 
                          theme === 'dark' && {
                            borderWidth : 1,
                            borderColor: 'white'
                          }
                        ]}
                        onPress={() => {
                          if (screen === 'blocked') return;

                          // 🔔 trigger highlight
                          triggerKeyPulse(keyIndex);

                          if (item === 'del') handleDelete();
                          else if (item === 'ok') handleOk();
                          else handleKeyPress(item);
                        }}
                      >
                        {item === 'del' ? (
                          <MaterialIcons name="backspace" size={28} color="#374151" />
                        ) : item === 'ok' ? (
                          <MaterialIcons
                            name="check-circle"
                            size={32}
                            color={pin.length === 4 ? '#16a34a' : '#9ca3af'}
                          />
                        ) : (
                          <Text style={[styles.keyText, theme === 'dark' && {
                            color : 'white'
                          }]}>{item}</Text>
                        )}
                      </TouchableOpacity>
                    </Animated.View>

                  );
                })}
              </View>
            )
          );
        })}
      </View>


      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
        actionLoader={undefined} closeHide={undefined}      />

      {/* Menu */}
      {menuVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          style={{ position: 'absolute', top: 10, right: 10 }}
        >
          <Animated.View
            style={{
              width: 160,
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              paddingVertical: 6,
              borderRadius: 10,
              elevation: 5,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 6,
              opacity: menuAnim,
              transform: [
                {
                  scale: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                onChangePinPress();
              }}
              style={{ paddingVertical: 10, paddingHorizontal: 14 }}
            >
              <Text style={[{ color: ERP_COLOR_CODE.ERP_APP_COLOR, fontSize: 15 }, theme == 'dark' && {
                color:'white'
              }]}>
                {t('text34')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                onRemovePinPress();
              }}
              style={{ paddingVertical: 10, paddingHorizontal: 14 }}
            >
              <Text style={{ color: '#dc2626', fontSize: 15 }}>
                {t('text33')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </Animated.View>
    </>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    paddingTop: 32,
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
    textAlign: 'center',
    paddingHorizontal: 20,
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
    borderWidth: 1,
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

export default PinSetupScreen;

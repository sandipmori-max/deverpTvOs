import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Image, FlatList, Animated, Easing, Platform, ImageBackground, Dimensions, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Formik } from 'formik';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loginUserThunk } from '../../../store/slices/auth/thunk';

import { styles } from './add_account_style';
import { erp_add_account_validation_schema, erpAddAccountValidationSchema } from '../../../utils/validations/add_accounts';
import { AddAccountScreenProps } from './type';
import { ERP_GIF, ERP_ICON } from '../../../assets';
import { DevERPService } from '../../../services/api';
import { useApi } from '../../../hooks/useApi';
import CustomAlert from '../../../components/alert/CustomAlert';
import { getMessaging } from '@react-native-firebase/messaging';
import useFcmToken from '../../../hooks/useFcmToken';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTranslation } from 'react-i18next';
import { ERP_COLOR_CODE } from '../../../utils/constants';
import { clearAuthState, setDashboard, setEmptyMenu } from '../../../store/slices/auth/authSlice';
import { resetAjaxState } from '../../../store/slices/ajax/ajaxSlice';
import { resetAttendanceState } from '../../../store/slices/attendance/attendanceSlice';
import { resetDropdownState } from '../../../store/slices/dropdown/dropdownSlice';
import { resetSyncLocationState } from '../../../store/slices/location/syncLocationSlice';
import { setReloadApp } from '../../../store/slices/reloadApp/reloadAppSlice';
import { generateGUID } from '../../../utils/helpers';
import { useBaseLink } from '../../../hooks/useBaseLink';
import SoftwareInfo from '../../../components/softwareInfo/SoftwareInfo';

const AddAccountScreen: React.FC<any> = ({ 
   setIsSwitchAccountOpen,
        setShowAddAccount,
        setShowAccountSwitcher,
  
  visible, onClose, isSwitchAccountOpen }) => {
  const { t } = useTranslation();
  const baseLink = useBaseLink();

  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state?.theme.mode);

  const { execute: validateCompanyCode, execute: loginWithERP } = useApi();
  const { accounts, user } = useAppSelector(state => state.auth);
  const { token: fcmToken } = useFcmToken();

  const [isInputEditCC, setIsInputEditCC] = useState(false);
  const [isInputEditUSer, setIsInputEditUser] = useState(false);
  const [isInputEditPass, setIsInputEditPass] = useState(false);

  const [deviceId, setDeviceId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [loader, setLoader] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
  });

  // Animated values
  const slideAnim = useRef(new Animated.Value(0)).current; // modal
  const formAnim = useRef(new Animated.Value(0)).current; // form container
  const buttonAnim = useRef(new Animated.Value(0)).current; // Add button
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoader(false);
  }, [visible]);

  useEffect(() => {
    return () => {
      setIsInputEditCC(false);
      setIsInputEditUser(false);
      setIsInputEditPass(false);
    };
  }, []);

  useEffect(() => {
    const fetchDeviceName = async () => {
      const name = await DeviceInfo.getDeviceName();
      setDeviceId(name);
      AsyncStorage.setItem('device', name);
    };
    fetchDeviceName();
  }, []);

  // Animate modal, form, and button
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      formAnim.setValue(0);
      buttonAnim.setValue(0);

      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.timing(formAnim, {
        toValue: 1,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        delay: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, formAnim, buttonAnim]);

  const handleClose = () => {
    setLoader(false);
    setAlertVisible(false);

    Animated.parallel([
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 950,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 850,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      DevERPService.setAppId(user?.app_id);
      DevERPService.setToken(user?.token);
      await AsyncStorage.setItem('erp_token', user?.token || '');
      await AsyncStorage.setItem('auth_token', user?.token || '');
      await AsyncStorage.setItem('erp_token_valid_till', user?.tokenValidTill || '');

      DevERPService.setAppId(user?.app_id || '');
      const validation = await validateCompanyCode(() =>
        DevERPService.validateCompanyCode(user?.company_code),
      );
      const currentFcmToken = Platform.OS === 'ios' ? "" : fcmToken || (await getMessaging().getToken());
      const loginResult = await loginWithERP(() =>
        DevERPService.loginToERP({
          user: user?.username,
          pass: user?.password,
          firebaseid: currentFcmToken,
        }),
      );
      DevERPService.setToken(loginResult?.token);
      await AsyncStorage.setItem('erp_token', loginResult?.token || '');
      await AsyncStorage.setItem('auth_token', loginResult?.token || '');
      await AsyncStorage.setItem('erp_token_valid_till', loginResult?.tokenValidTill || '');
      onClose();
    });
  };

  const handleAddAccount = async (values: { company_code: string; user: string; password: string }) => {
    try {
      DevERPService.setDevice(deviceId);
      setLoader(true);
      const userExists = accounts?.some(acc => acc?.user?.name === values?.user);
      const codeExists = accounts?.some(acc => acc?.user?.company_code === values?.company_code);
      if (userExists && codeExists) {
        setAlertConfig({
          title: t('test5'),
          message: t("msg.msg1"),
          type: 'error',
        });
        setAlertVisible(true);
        return;
      }
      const app_id = generateGUID();
      await AsyncStorage.setItem('appid', app_id)
      DevERPService.setAppId(app_id || '');
      const validation = await validateCompanyCode(() =>
        DevERPService.validateCompanyCode(values?.company_code),
      );
      if (!validation?.isValid) {
        setLoader(false);
        return;
      }

      const currentFcmToken = Platform.OS === 'ios' ? "" : fcmToken || (await getMessaging().getToken());

      const loginResult = await loginWithERP(() =>
        DevERPService.loginToERP({
          user: values?.user,
          pass: values?.password,
          firebaseid: currentFcmToken,
        }),
      );

      if (loginResult?.success !== 1) {
        DevERPService.setAppId(user?.app_id);
        DevERPService.setToken(user?.token);
        await AsyncStorage.setItem('erp_token', user?.token || '');
        await AsyncStorage.setItem('auth_token', user?.token || '');
        await AsyncStorage.setItem('erp_token_valid_till', user?.tokenValidTill || '');
        await validateCompanyCode(() =>
          DevERPService.validateCompanyCode(user?.company_code),
        );
        const currentFcmToken = Platform.OS === 'ios' ? "" : fcmToken || (await getMessaging().getToken());
        const loginResult = await loginWithERP(() =>
          DevERPService.loginToERP({
            user: user?.username,
            pass: user?.password,
            firebaseid: currentFcmToken,
          }),
        );
        DevERPService.setToken(loginResult?.token);
        await AsyncStorage.setItem('erp_token', loginResult?.token || '');
        await AsyncStorage.setItem('auth_token', loginResult?.token || '');
        await AsyncStorage.setItem('erp_token_valid_till', loginResult?.tokenValidTill || '');
        setAlertVisible(true);
        setLoader(false);
        setAlertConfig({
          title: t('test4'),
          message: loginResult?.message || t("msg.msg2"),
          type: 'error',
        });
        return;
      }

      dispatch(setDashboard([]));
      dispatch(setEmptyMenu([]));
      dispatch(resetAjaxState());
      dispatch(resetAttendanceState());
      dispatch(clearAuthState());
      dispatch(resetDropdownState());
      dispatch(resetSyncLocationState());
      DevERPService.setToken(loginResult?.token);
      await AsyncStorage.setItem('erp_token', loginResult?.token || '');
      await AsyncStorage.setItem('auth_token', loginResult?.token || '');
      await AsyncStorage.setItem('erp_token_valid_till', loginResult?.tokenValidTill || '');

      dispatch(
        loginUserThunk({
          newToken: loginResult?.token,
          newvalidTill: loginResult?.validtill,
          company_code: values?.company_code,
          password: values?.password,
          isAddingAccount: true,
          user_credentials: { user: values?.user, name: values?.user },
          response: loginResult,
          companyData: validation,
        }),
      );
      setAlertConfig({ title: t("title.title3"), message: t("msg.msg3"), type: 'success' });
      setAlertVisible(true);
      onClose();
      setLoader(false);
      setTimeout(() => {
        dispatch(setReloadApp())
      }, 1000);

    } catch (e: any) {
      setAlertConfig({
        title: t("title.title1"),
        message: e?.message || t("msg.msg4"),
        type: 'error',
      });
      setAlertVisible(true);
      setLoader(false);
    }
  };

  const ccErrorAnim = useRef(new Animated.Value(0)).current;
  const userErrorAnim = useRef(new Animated.Value(0)).current;
  const passErrorAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.86,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 4,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };


  return (
    <Modal visible={visible} transparent onRequestClose={handleClose}>
      <View
        style={{
          height: Dimensions.get('screen').height,
          
        }}
      >
        <View style={[styles.header, theme === 'dark' && { backgroundColor: 'black' }
        ]}>
          <TouchableOpacity onPress={() => {
            setIsSwitchAccountOpen(false)
            setShowAddAccount(false)
            setShowAccountSwitcher(false)
            handleClose()
          }} style={styles.closeButton}>
            {
              Platform.OS === 'ios' ? <>
                <MaterialIcons name="chevron-left" size={28} color={theme === 'dark' ? 'white' : "#000"} />

              </> : <Image source={ERP_ICON.BACK} style={styles.back} />
            }

          </TouchableOpacity>
          <Text style={[styles.title,
          {
            color: theme === 'dark' ? 'white' : 'black'
          }
          ]}>{t('account.addAccount')}</Text>
        </View>
        <View style={{flexDirection:'row'}}>
          <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.container,
                theme === 'dark' && { backgroundColor: 'black' },
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [800, 0],
                      }),
                    },
                  ],
                  opacity: slideAnim,
                },
                theme === 'dark' && {
                  marginTop: 0
                }
              ]}
            >
              <FlatList
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                keyboardShouldPersistTaps="handled"
                data={['']}
                renderItem={() => (
                  <Animated.View
                    style={{
                      opacity: formAnim,
                      transform: [
                        {
                          translateY: formAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <View style={styles.formContainer}>
                      <Image
                        //            source={{
                        //   uri:  `${baseLink}fileupload/1/InvoiceByConfig/1/logo.jpg`
                        // }}
                        source={ERP_ICON.APP_LOGO}
                        style={styles.logo} resizeMode="contain" />

                      <Text style={[styles.subtitle, theme === 'dark' && { color: 'white' }]}>{t('account.msg')}</Text>

                      <Formik
                        initialValues={{ company_code: '', user: '', password: '' }}
                        validationSchema={erpAddAccountValidationSchema(t)}
                        onSubmit={handleAddAccount}
                      >
                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => {
                          useEffect(() => {
                            if (touched?.company_code && errors?.company_code) {
                              ccErrorAnim.setValue(0);
                              Animated.timing(ccErrorAnim, {
                                toValue: 1,
                                duration: 280,
                                easing: Easing.out(Easing.ease),
                                useNativeDriver: true,
                              }).start();
                            }
                          }, [touched?.company_code, errors?.company_code]);

                          useEffect(() => {
                            if (touched?.user && errors?.user) {
                              userErrorAnim.setValue(0);
                              Animated.timing(userErrorAnim, {
                                toValue: 1,
                                duration: 280,
                                easing: Easing.out(Easing.ease),
                                useNativeDriver: true,
                              }).start();
                            }
                          }, [touched?.user, errors?.user]);

                          useEffect(() => {
                            if (touched?.password && errors?.password) {
                              passErrorAnim.setValue(0);
                              Animated.timing(passErrorAnim, {
                                toValue: 1,
                                duration: 280,
                                easing: Easing.out(Easing.ease),
                                useNativeDriver: true,
                              }).start();
                            }
                          }, [touched?.password, errors?.password]);

                          return (
                            <>
                              {/* Company Code Input */}
                              <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, theme === 'dark' && { color: 'white' }]}>{t('account.companyCode')}</Text>
                                <View style={[
                                  styles.inputContainer,
                                  {
                                    justifyContent: 'center',
                                    alignContent: 'center',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: ERP_COLOR_CODE.ERP_BORDER_LINE,
                                    paddingLeft: 12,
                                  },
                                  touched?.company_code && errors?.company_code && { borderColor: ERP_COLOR_CODE.ERP_ERROR, borderWidth: 0.8 },
                                  isInputEditCC && { borderColor: '#81b5e4', borderWidth: 0.8 },
                                  values?.company_code && { borderColor: 'green', borderWidth: 0.8 },
                                  theme === 'dark' && { backgroundColor: 'black' }
                                ]}>
                                  <MaterialIcons name="closed-caption-off" size={20} color={ERP_COLOR_CODE.ERP_999} />
                                  <TextInput
                                    style={[styles.input, theme === 'dark' && { backgroundColor: 'black', color: 'white' }]}
                                    placeholder={t('auth.enterCompanyCode')}
                                    placeholderTextColor={ERP_COLOR_CODE.ERP_999}
                                    autoCapitalize="none"
                                    onChangeText={handleChange('company_code')}
                                    value={values?.company_code}
                                    onFocus={() => setIsInputEditCC(true)}
                                    onBlur={() => { if (!values?.company_code) { handleBlur('company_code'); setIsInputEditCC(false); } }}
                                  />
                                </View>
                                {touched?.company_code && errors?.company_code && (
                                  <Animated.Text
                                    style={[
                                      styles.errorText,
                                      {
                                        opacity: ccErrorAnim,
                                        transform: [
                                          {
                                            translateX: ccErrorAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [-38, 0], // slide from LEFT
                                            }),
                                          },
                                        ],
                                      },
                                    ]}
                                  >
                                    {errors?.company_code}
                                  </Animated.Text>
                                )}

                              </View>

                              {/* User Input */}
                              <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, theme === 'dark' && { color: 'white' }]}>{t('auth.user')}</Text>
                                <View style={[
                                  styles.inputContainer,
                                  {
                                    justifyContent: 'center',
                                    alignContent: 'center',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: ERP_COLOR_CODE.ERP_BORDER_LINE,
                                    paddingLeft: 12,
                                  },
                                  touched?.user && errors?.user && { borderColor: ERP_COLOR_CODE.ERP_ERROR, borderWidth: 0.8 },
                                  isInputEditUSer && { borderColor: '#81b5e4', borderWidth: 0.8 },
                                  values?.user && { borderColor: 'green', borderWidth: 0.8 },
                                ]}>
                                  <MaterialIcons name="person" size={20} color={ERP_COLOR_CODE.ERP_999} />
                                  <TextInput
                                    style={[styles.input, theme === 'dark' && { backgroundColor: 'black', color: 'white' }]}
                                    placeholder={t('auth.enterUser')}
                                    placeholderTextColor={ERP_COLOR_CODE.ERP_999}
                                    autoCapitalize="none"
                                    onChangeText={handleChange('user')}
                                    value={values?.user}
                                    onFocus={() => setIsInputEditUser(true)}
                                    onBlur={() => { if (!values?.user) { handleBlur('user'); setIsInputEditUser(false); } }}
                                  />
                                </View>
                                {touched?.user && errors?.user && (
                                  <Animated.Text
                                    style={[
                                      styles.errorText,
                                      {
                                        opacity: userErrorAnim,
                                        transform: [
                                          {
                                            translateX: userErrorAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [-38, 0],
                                            }),
                                          },
                                        ],
                                      },
                                    ]}
                                  >
                                    {errors?.user}
                                  </Animated.Text>
                                )}

                              </View>

                              {/* Password Input */}
                              <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, theme === 'dark' && { color: 'white' }]}>{t('auth.password')}</Text>
                                <View style={[
                                  styles.inputContainer,
                                  {
                                    justifyContent: 'center',
                                    alignContent: 'center',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: ERP_COLOR_CODE.ERP_BORDER_LINE,
                                    paddingLeft: 12,
                                  },
                                  touched?.password && errors?.password && { borderColor: ERP_COLOR_CODE.ERP_ERROR, borderWidth: 0.8 },
                                  isInputEditPass && { borderColor: '#81b5e4', borderWidth: 0.8 },
                                  values?.password && { borderColor: 'green', borderWidth: 0.8 },
                                ]}>
                                  <MaterialIcons name="password" size={20} color={ERP_COLOR_CODE.ERP_999} />
                                  <TextInput
                                    style={[styles.input1, theme === 'dark' && { backgroundColor: 'black', color: 'white' }]}
                                    placeholder={t('auth.enterPassword')}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor={ERP_COLOR_CODE.ERP_999}
                                    value={values?.password}
                                    onChangeText={handleChange('password')}
                                    onFocus={() => setIsInputEditPass(true)}
                                    onBlur={() => { if (!values?.password) { handleBlur('password'); setIsInputEditPass(false); } }}
                                  />
                                  <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.toggleButton}>
                                    <MaterialIcons name={!showPassword ? 'visibility-off' : 'visibility'} color={ERP_COLOR_CODE.ERP_999} size={20} />
                                  </TouchableOpacity>
                                </View>
                                {touched?.password && errors?.password && (
                                  <Animated.Text
                                    style={[
                                      styles.errorText,
                                      {
                                        opacity: passErrorAnim,
                                        transform: [
                                          {
                                            translateX: passErrorAnim.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [-38, 0],
                                            }),
                                          },
                                        ],
                                      },
                                    ]}
                                  >
                                    {errors?.password}
                                  </Animated.Text>
                                )}

                              </View>

                              {/* Add Button */}
                              <Animated.View
                                style={{
                                  opacity: buttonAnim,
                                  transform: [
                                    {
                                      translateY: buttonAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                      }),
                                    },
                                    { scale: pressAnim }, // 👈 press animation
                                  ],
                                }}
                              >
                                <TouchableOpacity
                                  style={[
                                    styles.addButton,
                                    loader && styles.disabledButton,
                                    theme === 'dark' && {
                                      backgroundColor: 'white',
                                      borderColor: 'white',
                                      borderWidth: 1,
                                    },
                                  ]}
                                  onPress={() => handleSubmit()}
                                  onPressIn={onPressIn}
                                  onPressOut={onPressOut}
                                  disabled={loader}
                                  activeOpacity={1} // avoid opacity conflict
                                >
                                  <MaterialIcons
                                    name="person-add-alt"
                                    size={24}
                                    color={theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE}
                                  />
                                  <Text
                                    style={[
                                      styles.addButtonText,
                                      theme === 'dark' && { color: 'black' },
                                    ]}
                                  >
                                    {loader ? t('account.adding') : t('account.add')}
                                  </Text>
                                </TouchableOpacity>
                              </Animated.View>


                              <Text style={styles.note}>{t('account.msg1')}</Text>
                            </>
                          )
                        }}
                      </Formik>
                    </View>
                    <View style={{ height: 150 }} />
                  </Animated.View>
                )}
              />
              <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={async () => {
                  setLoader(false);
                  setAlertVisible(false);
                  DevERPService.setAppId(user?.app_id);
                  DevERPService.setToken(user?.token);
                  await AsyncStorage.setItem('erp_token', user?.token || '');
                  await AsyncStorage.setItem('auth_token', user?.token || '');
                  await AsyncStorage.setItem('erp_token_valid_till', user?.tokenValidTill || '');

                  DevERPService.setAppId(user?.app_id || '');
                  const validation = await validateCompanyCode(() => DevERPService.validateCompanyCode(user?.company_code)
                  );


                  const currentFcmToken = Platform.OS === 'ios' ? "" : fcmToken || (await getMessaging().getToken());

                  const loginResult = await loginWithERP(() => DevERPService.loginToERP({
                    user: user?.username,
                    pass: user?.password,
                    firebaseid: currentFcmToken,
                  })
                  );

                  DevERPService.setToken(loginResult?.token);
                  await AsyncStorage.setItem('erp_token', loginResult?.token || '');
                  await AsyncStorage.setItem('auth_token', loginResult?.token || '');
                  await AsyncStorage.setItem('erp_token_valid_till', loginResult?.tokenValidTill || '');

                  setAlertVisible(false);
                  setLoader(false);
                  setAlertConfig({
                    title: t('test4'),
                    message: loginResult?.message || t("msg.msg2"),
                    type: 'error',
                  });

                }}
                actionLoader={undefined}
                closeHide={undefined}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        <SoftwareInfo />
        </View>
      </View>
    </Modal>
  );
};

export default AddAccountScreen;

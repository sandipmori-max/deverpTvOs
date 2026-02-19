/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Keyboard,
  Platform,
  PermissionsAndroid,
  AppState,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { getERPPageThunk } from '../../../store/slices/auth/thunk';
import { savePageThunk } from '../../../store/slices/page/thunk';
import FullViewLoader from '../../../components/loader/FullViewLoader';
import NoData from '../../../components/no_data/NoData';
import ErrorMessage from '../../../components/error/Error';
import ERPIcon from '../../../components/icon/ERPIcon';
import ErrorModal from './components/ErrorModal';
import CustomPicker from './components/CustomPicker';
import Media from './components/Media';
import Disabled from './components/Disabled';
import Input from './components/Input';
import CustomAlert from '../../../components/alert/CustomAlert';
import AjaxPicker from './components/AjaxPicker';
import DateTimePicker from 'react-native-modal-datetime-picker';
import {
  applyActionsToControls,
  evaluateRulesWithActions,
  parseCustomDatePage,
  requestCameraPermission,
} from '../../../utils/helpers';
import DateRow from './components/Date';
import BoolInput from './components/BoolInput';
import SignaturePad from './components/SignaturePad';
import HtmlRow from './components/HtmlRow';
import { useBaseLink } from '../../../hooks/useBaseLink';
import DateTimeRow from './components/DateTimeRow';
import LocationRow from './components/LocationRow';
import FilePickerRow from './components/FilePicker';
import CustomMultiPicker from './components/CustomMultiPicker';
import { ERP_COLOR_CODE } from '../../../utils/constants';
import DeviceInfo from 'react-native-device-info';
import useTranslations from '../../../hooks/useTranslations';
import TranslatedText from '../tabs/home/TranslatedText';

type PageRouteParams = { PageScreen: { item: any } };

export async function requestLocationPermissions(): Promise<
  'granted' | 'foreground-only' | 'denied' | 'blocked'
> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        // PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ]);

      const fine = granted['android.permission.ACCESS_FINE_LOCATION'];
      const coarse = granted['android.permission.ACCESS_COARSE_LOCATION'];
      const background = granted['android.permission.ACCESS_BACKGROUND_LOCATION'];

      if (
        fine === PermissionsAndroid.RESULTS.GRANTED &&
        coarse === PermissionsAndroid.RESULTS.GRANTED &&
        background === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return 'granted';
      }

      if (
        fine === PermissionsAndroid.RESULTS.GRANTED &&
        coarse === PermissionsAndroid.RESULTS.GRANTED &&
        background !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        return 'foreground-only';
      }

      if (
        fine === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        coarse === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        background === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ) {
        return 'blocked';
      }
      return 'denied';
    } catch (err) {
      return 'denied';
    }
  }
  return 'granted';
}

const PageScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);
  const baseLink = useBaseLink();
  const theme = useAppSelector(state => state?.theme.mode);
  const { t } = useTranslations();
  const [buttonSave, setButtonSave] = useState(true);
  const [loadingPageId, setLoadingPageId] = useState<string | null>(null);
  const [controls, setControls] = useState<any[]>([]);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isValidate, setIsValidate] = useState(false);

  const [tapLoader, setTapLoader] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>({});

  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [activeDateTimeField, setActiveDateTimeField] = useState<string | null>(null);
  const [activeDateTime, setActiveDateTime] = useState<string | null>(null);

  const [activeDateField, setActiveDateField] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [goBack, setGoBack] = useState(false);
  const [loader, setLoader] = useState(false);
  const [actionLoader, setActionLoader] = useState(false);
  const [actionSaveLoader, setActionSaveLoader] = useState(false);
  const [infoData, setInfoData] = useState<any>({});
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
  });

  const [locationEnabled, setLocationEnabled] = useState<boolean | null>(null);
  const [modalClose, setModalClose] = useState(false);
  const [isSettingVisible, setIsSettingVisible] = useState(false);
  const [myScript, setMyScript] = useState('');
  const [backgroundDeniedModal, setBackgroundDeniedModal] = useState(false);

  const isCheckingPermission = useRef(false);
  const locationSyncInterval = useRef<NodeJS.Timeout | null>(null);
  const lastLocationEnabled = useRef<boolean | null>(null);
  const appState = useRef(AppState.currentState);
  const [scriptErrorMessage, setScriptErrorMessage] = useState<any>()
  const [isVisibleScriptError, setIsVisibleScriptError] = useState(false);

  const hasLocationField = controls.some(
    item => item?.defaultvalue && item?.defaultvalue === '#location' && item?.visible === '0',
  );

  const customScriptRule = '';
  //   const customScriptRule = `{
  //     "onClickButtonSave":
  //      {
  //         "logic": "OR",
  //          "rules": [
  //             {
  //                "left": "amount",
  //                "operator": "equals",
  //                "right": ""
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "buttonSave", "action": "disable" }
  //        ],
  //        "invalidActions": [
  //            { "field": "buttonSave", "action": "enable" }
  //        ],
  //        "message": ""
  //    },
  //    "onPageLoad":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "amount",
  //                "operator": "equals",
  //                "right": ""
  //            }
  //        ],
  //        "validActions": [
  //            { "field": "amount", "action": "enable" }
  //            ],
  //        "invalidActions": [
  //             { "field": "amount", "action": "disable" }
  //            ]
  //    },
  //    "place_onInputChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "place",
  //                "operator": "equals",
  //                "right": "test"
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "exptype", "action": "disable" }
  //            ],
  //        "invalidActions": [
  //             { "field": "exptype", "action": "enable" }
  //            ]
  //    },
  //    "projectid_onAjaxChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "projectname",
  //                "operator": "equals",
  //                "right": "00"
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "qty", "action": "setValue", "text" : "2580258"}
  //            ],
  //        "invalidActions": [
  //             { "field": "qty", "action": "disable" }
  //            ]
  //    },
  //    "entryby_onDropDownChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "entryby",
  //                "operator": "equals",
  //                "right": "Sandip Mori"
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "buttonSave", "action": "disable" }
  //            ],
  //        "invalidActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ]
  //    },
  //    "status_onBoolChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "propname",
  //                "operator": "equals",
  //                "right": "Active"
  //             }
  //        ],
  //        "validActions": [
  //             { "field": "propname", "action": "borderColor", "borderColor" :"red"}
  //            ],
  //        "invalidActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ]
  //    },
  //     "onImageChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "doctorlocation",
  //                "operator": "locationWithin",
  //                "right": "inlocation",
  //                "meters": 50
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ],
  //        "invalidActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ]
  //    },
  //    "onFileChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "doctorlocation",
  //                "operator": "locationWithin",
  //                "right": "inlocation",
  //                "meters": 50
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "buttonSave", "action": "disable" }
  //            ],
  //        "invalidActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ]
  //    },
  //     "onLocationChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "doctorlocation",
  //                "operator": "locationWithin",
  //                "right": "inlocation",
  //                "meters": 50
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ],
  //        "invalidActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ]
  //    },
  //    "onBarCodeChange":
  //    {
  //        "logic": "OR",
  //        "rules": [
  //            {
  //                "left": "doctorlocation",
  //                "operator": "locationWithin",
  //                "right": "inlocation",
  //                "meters": 50
  //            }
  //        ],
  //        "validActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ],
  //        "invalidActions": [
  //             { "field": "buttonSave", "action": "enable" }
  //            ]
  //    }
  // }`

  const hasMediaField = controls.some(
    item => item?.ctltype === 'IMAGE' || item?.ctltype === 'PHOTO',
  );

  useFocusEffect(
    useCallback(() => {
      setTapLoader(false);
      return () => {};
    }, [navigation]),
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const checkLocation = async () => {
      const enabled = await DeviceInfo.isLocationEnabled();
      setLocationEnabled(enabled);
    };

    checkLocation();

    interval = setInterval(checkLocation, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
    return true;
  };

  const startLocationSync = async () => {
    const enabled = await DeviceInfo.isLocationEnabled();
    if (!enabled) return;

    const hasPermission = await requestLocationPermission();
    const fullPermission = await requestLocationPermissions();

    if (fullPermission === 'foreground-only') {
      setBackgroundDeniedModal(true);
      return;
    }

    if (!hasPermission || fullPermission === 'denied' || fullPermission === 'blocked') return;

    if (locationSyncInterval.current) clearInterval(locationSyncInterval.current);

    checkLocation();
  };

  const checkLocation = async () => {
    try {
      const enabled = await DeviceInfo.isLocationEnabled();

      if (enabled !== locationEnabled) {
        setAlertConfig({
          title: t('title.title13'),
          message: enabled ? t('title.title14') : t('title.title15'),
          type: enabled ? 'success' : 'error',
        });
        setAlertVisible(!enabled);
        setModalClose(false);
        setLocationEnabled(enabled);
      }

      if (hasLocationField && enabled) {
        if (Platform.OS === 'android') {
          const granted = await requestLocationPermissions();
          if (granted === 'granted') {
            // location access
            setLocationVisible(true);
          } else if (granted === 'foreground-only') {
            setBackgroundDeniedModal(true);
            setLocationVisible(true);
          }
        }
      }
    } catch (err) {
      setLocationVisible(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkPermissionsOnFocus = async () => {
        if (isCheckingPermission.current) return;
        isCheckingPermission.current = true;

        const hasPermission = await requestLocationPermission();
        const fullPermission = await requestLocationPermissions();

        if (hasPermission && fullPermission === 'granted') {
          setAlertVisible(false);
          setIsSettingVisible(false);
          setModalClose(true);
          startLocationSync();
        } else if (hasPermission && fullPermission === 'foreground-only') {
          setBackgroundDeniedModal(true);
        } else {
          setAlertConfig({
            title: t('title.title13'),
            message: t('title.title15'),
            type: 'error',
          });
          setModalClose(false);

          setAlertVisible(true);
          setIsSettingVisible(true);
        }

        isCheckingPermission.current = false;
      };

      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active' && hasLocationField) {
          checkPermissionsOnFocus();
        }
      });

      if (hasLocationField) {
        checkPermissionsOnFocus();
      }

      return () => subscription.remove();
    }, []),
  );

  const route = useRoute<RouteProp<PageRouteParams, 'PageScreen'>>();
  const { item, title, id, isFromNew, url, pageTitle, isFromProfile }: any = route?.params;
  const isFromBusinessCard = route?.params?.isFromBusinessCard || false;

  const validateForm = useCallback(() => {
    setTapLoader(true);
    const validationErrors: Record<string, string> = {};
    const errorMessages: string[] = [];

    controls.forEach(ctrl => {
      if (ctrl?.mandatory === '1' && !formValues[ctrl?.field]) {
        validationErrors[ctrl.field] = `${ctrl?.fieldtitle || ctrl?.field} ${t('text.text43')}`;
        errorMessages.push(`${ctrl?.fieldtitle || ctrl?.field} ${t('text.text43')}`);
      }
    });

    setErrors(validationErrors);
    setErrorsList(errorMessages);
    setTimeout(() => {
      if (errorMessages?.length > 0) setShowErrorModal(true);
    }, 780);

    return errorMessages?.length === 0;
  }, [controls, formValues]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
      },
      headerBackTitle: '',
      headerTintColor: '#fff',
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 210 }}>
          <TranslatedText
            numberOfLines={1}
            style={{
              flexShrink: 1,
              fontSize: 18,
              fontWeight: '700',
              color: theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_WHITE,
            }}
            text={title || pageTitle || 'Details'}
          ></TranslatedText>
          {isFromProfile === false && (
            <TranslatedText
              numberOfLines={1}
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: ERP_COLOR_CODE.ERP_WHITE,
                marginLeft: 4,
              }}
              text={isFromNew ? `( ${t('text.text44')} )` : `( ${t('text.text45')} )`}
            ></TranslatedText>
          )}
        </View>
      ),
       headerRight: () => (
        <>
          {!error && !isFromNew && (
            <ERPIcon
              name="refresh"
              isLoading={actionLoader}
              onPress={() => {
                setButtonSave(true)
                setActionLoader(true);
                fetchPageData();
                setErrors({});
                setErrorsList([]);
              }}
            />
          )}
          {controls.length > 0 && (
            <ERPIcon
              name="save-as"
              isLoading={actionSaveLoader || tapLoader}
              onPress={async () => {
                console.log("myScript", myScript)
                try {
                  setTapLoader(true)
                  if (myScript) {
                    let rules;

                    if (typeof myScript === "string") {
                      try {
                        rules = JSON.parse(myScript);
                      } catch (e) {
                        console.error("Invalid JSON from backend", e);
                        setTapLoader(false)
                        return;
                      }
                    } else {
                      rules = myScript;
                    }

                    const { actions, messages } = evaluateRulesWithActions(rules, formValues);
                    console.log("myScript-------------------------------------------", myScript)
                    console.log("rules-------------------------------------------", rules)
                    console.log("actions-------------------------------------------", actions)
                    console.log("formValues-------------------------------------------", formValues)

                    const hasButtonSaveEnable = actions.some(
                      item => item?.field === "buttonSave"
                    );
                    if (hasButtonSaveEnable) {
                      const hasButtonSaveEnable = actions.some(
                        item => item?.field === "buttonSave" && item.action === "enable"
                      );
                      const updatedControls = applyActionsToControls(controls, actions);
                      setControls(updatedControls)
                      setButtonSave(hasButtonSaveEnable)
                      if (!hasButtonSaveEnable) {
                              setTapLoader(false);
                              setScriptErrorMessage(messages)
                              setIsVisibleScriptError(true)
                        return;
                      }
                    }
                    const updatedControls = applyActionsToControls(controls, actions);
                    setControls(updatedControls)
                  } 
                  console.log("hasButtonSaveEnable-------------------")

                  const locationEnabled = hasLocationField ? await DeviceInfo.isLocationEnabled() : true;

                  const permissionStatus = hasLocationField
                    ? await requestLocationPermissions()
                    : 'granted';

                  const hasCameraPermission = hasMediaField ? await requestCameraPermission() : true;

                  if (!hasCameraPermission && hasMediaField) {
                    setAlertVisible(true);
                    setModalClose(true);
                    setIsSettingVisible(true)
                    setAlertConfig({
                      title: t('title.title16'),
                      message: t("msg.msg15"),
                      type: 'error',
                    });
                    
                    return;
                  }

                  if (hasLocationField && !locationEnabled) {
                    setAlertConfig({
                      title: t("title.title13"),
                      message: t('title.title15'),
                      type: 'error',
                    });
                    setAlertVisible(true);
                    setModalClose(true);
                     setIsSettingVisible(true)
                    return;
                  }

                  if (hasLocationField && (permissionStatus === 'denied' || permissionStatus === 'blocked')) {
                    setAlertConfig({
                      title: t("title.title13"),
                      message: t('title.title15'),
                      type: 'error',
                    });
                    setAlertVisible(true);
                    setModalClose(false);
                    return;
                  }

                  // ✅ Permissions are granted, proceed
                  setLocationVisible(true);
                  setActionSaveLoader(true);
                  setIsValidate(true);

                  if (validateForm()) {
                    const submitValues: Record<string, any> = {};
                    controls?.forEach(f => {
                      if (f.refcol !== '1') submitValues[f?.field] = formValues[f?.field];
                    });

                    try {
                      setLoader(true);
                      await dispatch(savePageThunk({ page: url, id, data: { ...submitValues } })).unwrap();
                      setLoader(false);
                      setIsValidate(false);

                      fetchPageData();
                      setAlertConfig({
                        title: t('title.title17'),
                        message: t("title.title18"),
                        type: 'success',
                      });
                      setAlertVisible(true);
                      setGoBack(true);

                      setTimeout(() => {
                        setAlertVisible(false);
                        navigation.goBack();
                      }, 1800);
                    } catch (err: any) {
                      setLoader(false);
                      setAlertConfig({
                        title: t('title.title17'),
                        message: err,
                        type: 'error',
                      });
                      setAlertVisible(true);
                      setGoBack(false);
                    }
                  }

                  setActionSaveLoader(false);
                  setTimeout(() => {
                    setTapLoader(false)
                  }, 600)
                } catch (error) {
                  console.error("Save error:", error);
                  setTimeout(() => {
                    setTapLoader(false)
                  }, 600)
                  setActionSaveLoader(false);
                }
              }}
            />
          )}
        </>
      ),
    });
  }, [
    tapLoader,
    navigation,
    item?.name,
    id,
    controls,
    formValues,
    validateForm,
    goBack,
    alertVisible,
    loader,
    actionLoader,
    actionSaveLoader,
    buttonSave,
    error,
  ]);

  const fetchPageData = useCallback(async () => {
    try {
      setError(null);
      setLoadingPageId(isFromNew ? '0' : id);
      const parsed = await dispatch(
        getERPPageThunk({ page: url, id: isFromNew ? 0 : id }),
      ).unwrap();
     
      console.log("parsed?.script", parsed?.script)
      if (parsed?.script && typeof parsed.script === "object" && !Array.isArray(parsed.script)) {

        setMyScript(parsed.script);
}

     
      if (!isFromNew) {
        setInfoData({
          id: id?.toString(),
          tableName: parsed?.table,
          title: parsed?.title,
        });
      }

      const pageControls = Array.isArray(parsed?.pagectl) ? parsed?.pagectl : [];
      const normalizedControls = pageControls?.map(c => ({
        ...c,
        disabled: String(c?.disabled ?? '0'),
        visible: String(c?.visible ?? '1'),
        mandatory: String(c?.mandatory ?? '0'),
      }));

      setControls(normalizedControls);

      setFormValues(prev => {
        const merged: any = { ...prev };
        normalizedControls.forEach(c => {
          if (merged[c?.field] === undefined) {
            merged[c?.field] = c?.text ?? '';
          }
        });
        return merged;
      });
    } catch (e: any) {
      console.log(e)
      setError(JSON.stringify(e?.data) || 'Failed to load page');
    } finally {
      setLoadingPageId(null);
      setTimeout(() => {
        setActionLoader(false);
      }, 10);
    }
  }, [dispatch, id, url]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleAttachment = (base64: string, val: any) => {
    setFormValues(prev => {
      return { ...prev, [val]: base64 };
    });
  };

  const handleSignatureAttachment = (base64: string, val: any) => {
    setFormValues(prev => {
      return { ...prev, [val]: base64 };
    });
  };

  const showDateTimePicker = (field: string, date: any) => {
    setActiveDateTimeField(field);
    setActiveDateTime(date);
    setDateTimePickerVisible(true);
  };

  const hideDateTimePicker = () => {
    setDateTimePickerVisible(false);
    setActiveDateTimeField(null);
  };

  const handleDateTimeConfirm = (date: Date) => {
    if (activeDateTimeField) {
      setFormValues(prev => ({ ...prev, [activeDateTimeField]: date.toISOString() }));
    }
    hideDateTimePicker();
  };

  // useEffect(() => {
  //   let parsedRules;

  //   if (typeof customScriptRule === 'string') {
  //     try {
  //       const json = JSON.parse(customScriptRule);
  //       parsedRules = json.onPageLoad;
  //     } catch (e) {
  //       console.error('Invalid JSON from backend', e);
  //       return;
  //     }
  //   } else {
  //     parsedRules = customScriptRule?.onPageLoad;
  //   }

  //   if (!parsedRules) return;

  //   console.log('Parsed Rules:', parsedRules);

  //   const { actions = [] } = evaluateRulesWithActions(parsedRules, formValues);

  //   console.log('Actions:', actions);

  //   // ✅ Check buttonSave enable action
  //   const isButtonSaveEnabled = actions.some(
  //     item => item?.field === 'buttonSave' && item?.action === 'enable'
  //   );

  //   // ✅ Apply actions once
  //   const updatedControls = applyActionsToControls(controls, actions);
  //   setControls(updatedControls);

  //   // ✅ Update button state
  //   setButtonSave(isButtonSaveEnabled);

  // }, [formValues]);

  const applyActionsToFormValues = (formValues, actions) => {
    let updatedValues = { ...formValues };

    actions.forEach(action => {
      if (action?.action === 'setValue' && action?.field) {
        updatedValues[action.field] = action.text ?? '';
        console.log(`✅ setValue applied → ${action.field} = ${action.text}`);
      }
    });

    return updatedValues;
  };

  console.log('================ SET VALUE START ================', formValues);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const setValue = val => {
        console.log(
          '================********* SET VALUE START ================',
          item?.field,
          '=====,',
          val,
        );

        if (myScript) {
          console.log('Incoming value:', val);
          console.log('Field:', item?.field);
          console.log('Item:', item);

          let updatedValues;

          if (typeof val === 'object' && val !== null) {
            updatedValues = { ...formValues, ...val };
            console.log('Merged object value:', updatedValues);
          } else {
            updatedValues = { ...formValues, [item.field]: val };
            console.log('Single field update:', updatedValues);
          }

          // 🔹 Update form values
          setFormValues(updatedValues);

          // 🔹 Clear field error
          setErrors(prev => ({ ...prev, [item?.field]: '' }));

          // 🔥 RULE EXECUTION LOGS
          const eventName = getEventByControl(item);
          console.log('Detected Event:', eventName);

          const ruleKey = `${item.field}_${eventName}`;
          console.log('Generated Rule Key:', ruleKey);

          console.log('All Parsed Rules Keys:', Object.keys(parsedRules || {}));

          const rule = parsedRules?.[ruleKey];
          console.log('Matched Rule:', rule);

          if (!rule) {
            console.log('❌ No rule found for:', ruleKey);
            console.log('================ SET VALUE END ==================');
            return;
          }

          console.log('✅ Rule Found → Evaluating...', updatedValues);

          const { actions } = evaluateRulesWithActions(rule, updatedValues);
          console.log('Rule Actions:', actions);

          if (!actions || actions.length === 0) {
            console.log('⚠️ No actions returned from rule');
            console.log('================ SET VALUE END ==================');
            return;
          }

          /* 🔥 NEW PART — handle setValue action */
          let newFormValues = { ...updatedValues };
          let isFormValueChanged = false;

          actions.forEach(action => {
            if (action?.action === 'setValue' && action?.field) {
              newFormValues[action.field] = action.text ?? '';
              isFormValueChanged = true;
              console.log(`📝 setValue → ${action.field} = ${action.text}`);
            }
          });

          /* 🔹 Update formValues only if needed */
          if (isFormValueChanged) {
            console.log('Updated FormValues:', newFormValues);
            setFormValues(newFormValues);
          }

          /* 🔹 Existing logic (unchanged) */
          const updatedControls = applyActionsToControls(controls, actions);
          console.log('Updated Controls:', updatedControls);

          setControls(updatedControls);

        } else {
          if (typeof val === 'object' && val !== null) {
            setFormValues(prev => ({ ...prev, ...val }));
          } else {
            setFormValues(prev => ({ ...prev, [item?.field]: val }));
          }
          setErrors(prev => ({ ...prev, [item?.field]: '' }));
        }
      };

      const value =
        formValues[item?.field] === '#location'
          ? ''
          : formValues[item?.field] || formValues[item?.text] || '';

      if (item?.visible === '1') return null;

      let content = null;
      //BoolInput
      if (item?.ctltype === 'BOOL') {
        const rawVal = formValues[item?.field] ?? item?.text;
        const boolVal = String(rawVal).toLowerCase() === 'true';
        content = (
          <BoolInput
            label={item?.fieldtitle}
            value={boolVal}
            onChange={val => {
              setValue({ [item?.field]: val });
            }}
          />
        );
      }
      //----PENDING----CustomMultiPicker
      else if (item?.field === '---') {
        content = (
          <CustomMultiPicker
            isValidate={isValidate}
            label={item?.fieldtitle}
            selectedValue={value}
            dtext={item?.dtext || item?.text || ''}
            onValueChange={setValue}
            options={item?.options || []}
            item={item}
            errors={errors}
          />
        );
      }
      //FilePickerRow
      else if (item?.ctltype === 'FILE') {
        content = (
          <FilePickerRow
            isValidate={isValidate}
            baseLink={baseLink}
            infoData={infoData}
            item={item}
            handleAttachment={handleAttachment}
          />
        );
      }
    
      //LocationRow
      else if (item?.defaultvalue === '#location') {
        content = (
          <LocationRow
            locationVisible={locationVisible}
            isValidate={isValidate}
            locationEnabled={locationEnabled}
            item={item}
            setValue={setValue}
          />
        );
      }
      //HtmlRow
      else if (item?.defaultvalue === '#html') {
        content = (
          <View>
            <HtmlRow item={item} isFromPage={true} />
          </View>
        );
      }
      //SignaturePad
      else if (item?.ctltype === 'IMAGE' && item?.field === 'signature') {
        content = (
          <SignaturePad
            isValidate={isValidate}
            infoData={infoData}
            item={item}
            handleSignatureAttachment={handleSignatureAttachment}
          />
        );
      }
      //Media - BusinessCardView
      else if (item?.ctltype === 'FILE' || item?.ctltype === 'IMAGE' || item?.ctltype === 'PHOTO') {
        content = (
          <>
             <Media
                isValidate={isValidate}
                baseLink={baseLink}
                infoData={infoData}
                item={item}
                isFromNew={isFromNew}
                handleAttachment={handleAttachment}
              />
            
          </>
        );
      }
      //Disabled
      else if (item?.disabled === '1' && item?.ajax !== 1) {
        content = <Disabled item={item} value={value} type={item?.ctltype} />;
      }
      //CustomPicker
      else if (item?.ddl && item?.ddl !== '' && item?.ajax === 0) {
        content = (
          <CustomPicker
            isForceOpen={true}
            isValidate={isValidate}
            label={item?.fieldtitle}
            selectedValue={value}
            dtext={item?.dtext || item?.text || ''}
            onValueChange={setValue}
            options={item?.options || []}
            item={item}
            errors={errors}
          />
        );
      }
      //AjaxPicker
      else if (item?.ddl && item?.ddl !== '' && item?.ajax === 1) {
        content = (
          <AjaxPicker
            isForceOpen={true}
            isValidate={isValidate}
            label={item?.fieldtitle}
            selectedValue={value}
            dtext={item?.dtext || item?.text || ''}
            onValueChange={setValue}
            options={item?.options || []}
            item={item}
            errors={errors}
            formValues={formValues}
          />
        );
      }
      //DATE
      else if (item?.ctltype === 'DATE') {
        content = (
          <DateRow
            isValidate={isValidate}
            item={item}
            errors={errors}
            value={value}
            showDatePicker={showDatePicker}
          />
        );
      }
      //DATETIME
      else if (item?.ctltype === 'DATETIME') {
        content = (
          <DateTimeRow
            isValidate={isValidate}
            item={item}
            errors={errors}
            value={value}
            showDateTimePicker={showDateTimePicker}
          />
        );
      }
      //Input
      else {
        content = (
          <Input
            id={item?.fieldtitle}
            isValidate={isValidate}
            onFocus={() => flatListRef.current?.scrollToIndex({ index, animated: true })}
            item={item}
            errors={errors}
            value={value}
            setValue={setValue}
          />
        );
      }
      //content
      return (
        <Animated.View
          entering={FadeInUp.delay(index * 70).springify()}
          layout={Layout.springify()}
        >
          {content}
        </Animated.View>
      );
    },
    [formValues, errors, controls, locationEnabled],
  );

  const getEventByControl = item => {
    if (item?.ctltype === 'BOOL') return 'onBoolChange';
    if (item?.ctltype === 'IMAGE') return 'onImageChange';
    if (item?.ctltype === 'FILE') return 'onFileChange';
    if (item?.defaultvalue === '#location') return 'onLocationChange';
    if (item?.ctltype === 'QRSCANNER') return 'onBarCodeChange';
    if (item?.ajax === 1) return 'onAjaxChange';
    if (item?.ddl && item?.ddl !== '') return 'onDropDownChange';
    return 'onInputChange';
  };

  const getRuleKey = item => {
    const eventName = getEventByControl(item);
    return `${item.field}_${eventName}`;
  };

  const parsedRules = useMemo(() => {
    try {
      return JSON.parse(customScriptRule);
    } catch (e) {
      console.error('Invalid rules JSON');
      return {};
    }
  }, []);

  const showDatePicker = (field: string, date: any) => {
    setActiveDateField(field);
    setActiveDate(date);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
    setActiveDateField(null);
  };

  const handleConfirm = (date: Date) => {
    if (activeDateField) {
      setFormValues(prev => ({ ...prev, [activeDateField]: date.toISOString() }));
    }
    hideDatePicker();
  };

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (loadingPageId) {
    return <FullViewLoader isShowTop={theme === 'dark' ? false : true} />;
  }
  return (
    <>
      {theme !== 'dark' && (
        <View
          style={{
            height: 16,
            width: '100%',
            backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        ></View>
      )}
      <View
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE,
        }}
      >
        {loadingPageId ? (
          <FullViewLoader />
        ) : !!error ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignContent: 'center',
              backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE,
            }}
          >
            <ErrorMessage message={error} isShowTop={false} />
          </View>
        ) : controls?.length > 0 ? (
          <>
            <View
              style={{
                flex: 1,
                height: Dimensions.get('screen').height,
                backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE,
              }}
            >
              <FlatList
                showsVerticalScrollIndicator={false}
                data={controls}
                ref={flatListRef}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: keyboardHeight }}
                keyboardShouldPersistTaps="handled"
              />
 
            </View>
            <CustomAlert
              visible={alertVisible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
              onClose={() => {
                setTapLoader(false);
                if (modalClose) setAlertVisible(false);
              }}
              actionLoader={undefined}
              isSettingVisible={isSettingVisible}
              closeHide={undefined}
            />
            {loader && (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 999,
                }}
              >
                <FullViewLoader />
              </View>
            )}
          </>
        ) : (
          <View
            style={[
              { flex: 1 },
              theme === 'dark' && {
                backgroundColor: 'black',
                width: '100%',
              },
            ]}
          >
            <NoData isShowTop={false} />
          </View>
        )}

        <ErrorModal
          visible={isVisibleScriptError}
          errors={scriptErrorMessage}
          onClose={() => {
            setTapLoader(false);
            setIsVisibleScriptError(false);
          }}
        />
        <ErrorModal
          visible={showErrorModal}
          errors={errorsList}
          onClose={() => {
            setTapLoader(false);
            setShowErrorModal(false);
          }}
        />

        {dateTimePickerVisible && Platform.OS === 'ios' && (
          <DateTimePicker
            isVisible={dateTimePickerVisible}
            mode="datetime"
            display="spinner"
            is24Hour={false}
            date={activeDateTime ? parseCustomDatePage(activeDateTime) : new Date()}
            onConfirm={handleDateTimeConfirm}
            onCancel={hideDateTimePicker}
            cancelTextIOS="Cancel"
            confirmTextIOS="Done"
          />
        )}

        {datePickerVisible && Platform.OS === 'ios' && (
          <DateTimePicker
            isVisible={datePickerVisible}
            mode="date"
            date={activeDate ? parseCustomDatePage(activeDate) : new Date()}
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            display="spinner"
            is24Hour={false}
            cancelTextIOS="Cancel"
            confirmTextIOS="Done"
          />
        )}

        {Platform.OS !== 'ios' && (
          <DateTimePicker
            isVisible={dateTimePickerVisible}
            mode="datetime"
            display="spinner"
            is24Hour={false}
            date={activeDateTime ? parseCustomDatePage(activeDateTime) : new Date()}
            onConfirm={handleDateTimeConfirm}
            onCancel={hideDateTimePicker}
            cancelTextIOS="Cancel"
            confirmTextIOS="Done"
          />
        )}

        {Platform.OS !== 'ios' && (
          <DateTimePicker
            isVisible={datePickerVisible}
            mode="date"
            display="spinner"
            is24Hour={false}
            date={activeDate ? parseCustomDatePage(activeDate) : new Date()}
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            cancelTextIOS="Cancel"
            confirmTextIOS="Done"
          />
        )}

        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => {
            setTapLoader(false);
            setAlertVisible(false);
            if (goBack) {
              navigation.goBack();
            }
          }}
          actionLoader={undefined}
          closeHide={undefined}
        />
      </View>
    </>
  );
};

export default PageScreen;

import React, { useEffect, useState, useRef } from "react";
import {
  PermissionsAndroid,
  Platform,
  NativeModules,
  AppState,
  Linking,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { checkAuthStateThunk } from "../store/slices/auth/thunk";
import DevERPService from "../services/api/deverp";
import AuthNavigator from "./AuthNavigator";
import StackNavigator from "./StackNavigator";
import FullViewLoader from "../components/loader/FullViewLoader";
import DeviceInfo from "react-native-device-info";
import CustomAlert from "../components/alert/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ERP_COLOR_CODE } from "../utils/constants";
import { changeLanguage } from "../i18n";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { getLastPunchInThunk } from "../store/slices/attendance/thunk";
import { setReloadApp } from "../store/slices/reloadApp/reloadAppSlice";
import {
  updateAttendanceState,
  updatePinVerifyLoadedState,
} from "../store/slices/auth/authSlice";
import { useTranslation } from "react-i18next";

// ------------------------- Location Permission Helper -------------------------
export async function requestLocationPermissions(): Promise<
  "granted" | "foreground-only" | "denied" | "blocked"
> {
  if (Platform.OS === "android") {
    const fine = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (fine === PermissionsAndroid.RESULTS.GRANTED) {
      // Ask background AFTER foreground
      const background = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );

      return background === PermissionsAndroid.RESULTS.GRANTED
        ? "granted"
        : "foreground-only";
    }

    if (fine === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return "blocked";
    }

    return "denied";
  }

  // -------------------- iOS --------------------
  const whenInUse = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

  if (whenInUse === RESULTS.GRANTED || whenInUse === RESULTS.LIMITED) {
    const always = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
    return always === RESULTS.GRANTED ? "granted" : "foreground-only";
  }

  if (whenInUse === RESULTS.BLOCKED) {
    return "blocked";
  }

  return "denied";
}

// ------------------------- RootNavigator -------------------------
const RootNavigator = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const LOCATION_MESSAGES = {
    PERMISSION_DENIED: t("text1"),
    SERVICE_DISABLED: t("text2"),
  };

  const { isLoading, isAuthenticated, accounts, user, appColorCode } =
    useAppSelector((state) => state.auth);
  const { reLoading } = useAppSelector((state) => state.reloadApp);

  const langCode = useAppSelector((state) => state.theme.langcode);

  const [alertVisible, setAlertVisible] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [isLocationRequired, setIsLocationReuired] = useState(false);

  const [backgroundDeniedModal, setBackgroundDeniedModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "error" as "error" | "success" | "info" | "location",
  });

  const locationModalShownRef = useRef(false);
  const appState = useRef(AppState.currentState);

  const locationServiceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gpsModalShownRef = useRef(false);

  const checkLocationServiceOnly = async () => {
    if (!isAuthenticated) return;

    const enabled = await DeviceInfo.isLocationEnabled();

    // GPS OFF → show modal once & stop features
    if (!enabled && !gpsModalShownRef.current) {
      setAlertConfig({
        title: t("test3"),
        message: LOCATION_MESSAGES.SERVICE_DISABLED,
        type: "location",
      });

      setAlertVisible(true);
      setOpenSettings(false);
      setBackgroundDeniedModal(false);

      gpsModalShownRef.current = true;
      locationModalShownRef.current = true; // reuse existing stop-flow logic
      return;
    }

    // GPS ON again → reset flags & resume
    if (enabled && gpsModalShownRef.current) {
      gpsModalShownRef.current = false;
      locationModalShownRef.current = false;
      setAlertVisible(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Start checking every 1 second
    locationServiceIntervalRef.current = setInterval(() => {
      try {
        dispatch(getLastPunchInThunk())
          .unwrap()
          .then((res) => {
            if (res?.success === 1 || res?.success === "1") {
              dispatch(updateAttendanceState(true));
              checkLocationServiceOnly();
            } else {
              dispatch(updateAttendanceState(false));
            }
          })
          .catch((err) => {
            dispatch(updateAttendanceState(false));
          });
      } catch (error) {
        dispatch(updateAttendanceState(false));

        console.log(error);
      }
    }, 1000);

    return () => {
      // Cleanup on logout / unmount
      if (locationServiceIntervalRef.current) {
        clearInterval(locationServiceIntervalRef.current);
        locationServiceIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, reLoading]);
  const app_id = user?.app_id;

  useEffect(() => {
    const fetchDeviceName = async () => {
      const name = await DeviceInfo.getDeviceName();
      let appid = await AsyncStorage.getItem("appid");
      if (!appid) {
        appid = app_id;
        await AsyncStorage.setItem("appid", appid || "");
      }
      await AsyncStorage.setItem("device", name);

      DevERPService.initialize();
      DevERPService.setAppId(appid || "");
      DevERPService.setDevice(name);

      dispatch(checkAuthStateThunk());
    };
    fetchDeviceName();
  }, [dispatch]);

  // ------------------------- AppState Listener -------------------------
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        try {
          dispatch(getLastPunchInThunk())
            .unwrap()
            .then((res) => {
              if (res?.success === 1 || res?.success === "1") {
                dispatch(updateAttendanceState(true));

                checkLocation();
              } else {
                dispatch(updateAttendanceState(false));
              }
            })
            .catch((err) => {
              dispatch(updateAttendanceState(false));
            });
        } catch (error) {
          dispatch(updateAttendanceState(false));

          console.log(error);
        }
      }
      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [isAuthenticated, reLoading]);

  // ------------------------- Language -------------------------
  useEffect(() => {
    changeLanguage(langCode);
  }, [langCode]);

  // ------------------------- Device Setup -------------------------
  const init = async () => {
    const name = await DeviceInfo.getDeviceName();
    await AsyncStorage.setItem("device", name);
    await DevERPService.initialize();
    await dispatch(checkAuthStateThunk());
  };

  // ------------------------- Check Location -------------------------
  const checkLocation = async () => {
    if (!isAuthenticated) return;

    const enabled = await DeviceInfo.isLocationEnabled();

    const permission = await requestLocationPermissions();

    if (enabled && permission === "granted") {
      locationModalShownRef.current = false;
      setAlertVisible(false);
      setBackgroundDeniedModal(false);

      if (accounts.length) {
        const data = accounts
          .map((u) => {
            if (user?.id.toString() === u?.user?.id.toString()) {
              return {
                token: u.user.token,
                link: u.user.companyLink.replace(/^https:\/\//i, "http://"),
              };
            }
            return null;
          })
          .filter(Boolean);

        NativeModules.LocationModule.setUserTokens(data);
        NativeModules.LocationModule.startService();
      }
      return;
    }

    if (permission === "foreground-only") {
      setBackgroundDeniedModal(true);
      setAlertVisible(false);
      return;
    }

    // ------------------------- Denied / Disabled Handling -------------------------
    if (!locationModalShownRef.current) {
      // CASE 1: Location service disabled (GPS OFF)
      if (!enabled) {
        setAlertConfig({
          title: t("test3"),
          message: LOCATION_MESSAGES.SERVICE_DISABLED,
          type: "location",
        });

        setAlertVisible(true);
        setOpenSettings(false);
        setBackgroundDeniedModal(false); // ❌ no Open Settings modal
        locationModalShownRef.current = true;
        return;
      }

      // CASE 2: Permission denied or blocked
      if (permission === "denied" || permission === "blocked") {
        setAlertConfig({
          title: "Permission Denied",
          message: LOCATION_MESSAGES.PERMISSION_DENIED,
          type: "location",
        });

        setAlertVisible(true);
        setOpenSettings(true);
        setBackgroundDeniedModal(false); // ❌ background modal not needed here
        locationModalShownRef.current = true;
        return;
      }
    }
  };

  useEffect(() => {
    init();
    return () => {
      dispatch(setReloadApp());
      dispatch(updatePinVerifyLoadedState(false));
    };
  }, []);

  // ------------------------- Focus -------------------------
  useEffect(() => {
    if (isAuthenticated) {
      // Optional: cancel timeout if component unmounts
      const timer = setTimeout(() => {
        try {
          dispatch(getLastPunchInThunk())
            .unwrap()
            .then((res) => {
              if (res?.success === 1 || res?.success === "1") {
                dispatch(updateAttendanceState(true));

                checkLocation();
              } else {
                dispatch(updateAttendanceState(false));

                setAlertVisible(false);
                setOpenSettings(false);
                setBackgroundDeniedModal(false);
                NativeModules.LocationModule.setUserTokens([]);
                NativeModules.LocationModule.stopService();
              }
            })
            .catch((err) => {
              dispatch(updateAttendanceState(false));

              setAlertVisible(false);
              setOpenSettings(false);
              setBackgroundDeniedModal(false);
              NativeModules.LocationModule.setUserTokens([]);
              NativeModules.LocationModule.stopService();
            });
        } catch (error) {
          dispatch(updateAttendanceState(false));

          console.log(error);
        }
      }, 2500);
      // Cleanup to avoid memory leaks
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, reLoading]);

  // ------------------------- Render -------------------------
  if (isLoading) return <FullViewLoader />;

  return (
    <>
      {isAuthenticated ? <StackNavigator /> : <AuthNavigator />}
      {isAuthenticated && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => {
            // setAlertVisible(true)
          }}
          isSettingVisible={openSettings}
          actionLoader={undefined}
          closeHide={true}
        />
      )}
      {isAuthenticated && (
        <Modal visible={backgroundDeniedModal} transparent>
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>{t("test21")}</Text>
              <Text style={styles.message}>{t("test22")}</Text>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.btnText}>{t("test23")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default RootNavigator;

// ------------------------- Styles -------------------------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "85%",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    textAlign: "center",
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
    padding: 12,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});

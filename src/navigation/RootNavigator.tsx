import React, { useEffect} from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { checkAuthStateThunk } from "../store/slices/auth/thunk";
import DevERPService from "../services/api/deverp";
import AuthNavigator from "./AuthNavigator";
import StackNavigator from "./StackNavigator";
import FullViewLoader from "../components/loader/FullViewLoader";
import DeviceInfo from "react-native-device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { changeLanguage } from "../i18n";
import { setReloadApp } from "../store/slices/reloadApp/reloadAppSlice";
import {
  updatePinVerifyLoadedState,
} from "../store/slices/auth/authSlice";
import { useTranslation } from "react-i18next";

// ------------------------- RootNavigator -------------------------
const RootNavigator = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
 
  const { isLoading, isAuthenticated, user } =
    useAppSelector((state) => state.auth);

  const langCode = useAppSelector((state) => state.theme.langcode);

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

  useEffect(() => {
    init();
    return () => {
      dispatch(setReloadApp());
      dispatch(updatePinVerifyLoadedState(false));
    };
  }, []);

  // ------------------------- Render -------------------------
  if (isLoading) return <FullViewLoader />;

  return (
    <>
      {isAuthenticated ? <StackNavigator /> : <AuthNavigator />}
    </>
  );
};

export default RootNavigator;
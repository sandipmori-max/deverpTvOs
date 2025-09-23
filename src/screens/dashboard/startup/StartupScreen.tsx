import React, { useEffect } from "react";
import { View } from "react-native";
import { getDBConnection, isPinEnabled } from "../../../utils/sqlite";
import FullViewLoader from "../../../components/loader/FullViewLoader";
import { useAppDispatch } from "../../../store/hooks";
import { setIsPinLoaded } from "../../../store/slices/auth/authSlice";

const StartupScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkPin = async () => {
      const db = await getDBConnection();
      const enabled = await isPinEnabled(db);
        console.log("🚀 ~ checkPin ~ enabled:--------+++++++------++++++++++++++++++++++++++", enabled)
        // dispatch(setIsPinLoaded())
      if (enabled) {
        navigation.replace("PinVerify");
      } else {
        navigation.replace("Drawer");
      }
    };
    checkPin();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <FullViewLoader />
    </View>
  );
};

export default StartupScreen;

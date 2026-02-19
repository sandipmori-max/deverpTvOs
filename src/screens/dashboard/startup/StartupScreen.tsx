import React, { useEffect } from "react";
import { View } from "react-native";
import { getDBConnection, isPinEnabled } from "../../../utils/sqlite";
import FullViewLoader from "../../../components/loader/FullViewLoader";
import { useAppSelector } from "../../../store/hooks";

const StartupScreen = ({ navigation }: any) => {
  const { isPinVerifyLoaded } = useAppSelector(state => state.auth);

  useEffect(() => {
    const checkPin = async () => {
      const db = await getDBConnection();
      const enabled = await isPinEnabled(db);
      if (enabled && !isPinVerifyLoaded) {
        navigation.replace("PinVerify");
      } else {
        navigation.replace("Drawer");
      }
    };
    checkPin();
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <FullViewLoader isShowTop={false}/>
    </View>
  );
};

export default StartupScreen;

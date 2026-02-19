import {
  View,
  Text,
  Image,
  TextInput,
  AppState,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import Geolocation from "@react-native-community/geolocation";
import { launchCamera } from "react-native-image-picker";

import { AttendanceFormValues, UserLocation } from "../types";
import {
  firstLetterUpperCase,
  requestCameraAndLocationPermission,
} from "../../../../utils/helpers";
import useTranslations from "../../../../hooks/useTranslations";
import { styles } from "../attendance_style";
import CustomAlert from "../../../../components/alert/CustomAlert";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { markAttendanceThunk } from "../../../../store/slices/attendance/thunk";
import { ERP_COLOR_CODE } from "../../../../utils/constants";
import { useNavigation } from "@react-navigation/native";
import SlideButton from "./SlideButton";
import { useBaseLink } from "../../../../hooks/useBaseLink";
import ProfileImage from "../../../../components/profile/ProfileImage";
import DeviceInfo from "react-native-device-info";
import { setReloadApp } from "../../../../store/slices/reloadApp/reloadAppSlice";
import { Easing } from "react-native";
import ImageBottomSheetModal from "../../../../components/bottomsheet/ImageBottomSheetModal";
import TranslatedText from "../../tabs/home/TranslatedText";
import { updateAttendanceState } from "../../../../store/slices/auth/authSlice";

const AttendanceForm = ({ setBlockAction, resData }: any) => {
  const { t } = useTranslations();
  const [showModal, setShowModal] = useState(false);
  const [img, setImg] = useState("");
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user, attendanceDone: isAttendanceDone } =
  useAppSelector((state) => state?.auth);

  const baseLink = useBaseLink();
  const theme = useAppSelector((state) => state?.theme.mode);
  const [statusImage, setStatusImage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [attendanceDone, setAttendanceDone] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [isSettingVisible, setIsSettingVisible] = useState(false);
  const [modalClose, setModalClose] = useState(false);
  const [alertLocationVisible, setLocationAlertVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "info" as "error" | "success" | "info",
  });
  const [alertMapVisible, setAlertMapVisible] = useState(false);

 
  const [alertMapConfig, setAlertMapConfig] = useState({
    title: "",
    message: "",
    type: "info" as "error" | "success" | "info" | 'location',
  });
  // -------------------- Pending Camera Action --------------------
  const pendingCameraAction = useRef<{
    setFieldValue: (field: keyof AttendanceFormValues, value: any) => void;
    handleSubmit: () => void;
  } | null>(null);

  // -------------------- AppState Listener --------------------
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active" && pendingCameraAction.current) {
          const hasPermission = await requestCameraAndLocationPermission();
          if (hasPermission) {
            setIsSettingVisible(false);
            setAlertVisible(false);
            const { setFieldValue, handleSubmit } = pendingCameraAction.current;
            pendingCameraAction.current = null;
            openCamera(setFieldValue, handleSubmit);
          }
        }
      },
    );
    return () => subscription.remove();
  }, []);

  const openCamera = (
    setFieldValue: (field: keyof AttendanceFormValues, value: any) => void,
    handleSubmit: () => void,
  ) => {
    launchCamera(
      {
        mediaType: "photo",
        cameraType: "back",
        quality: 0.7,
        includeBase64: true,
      },
      (response) => {
        if (response?.didCancel || response?.errorCode) {
          setLocationLoading(false);
          setBlockAction(false);
          return;
        }
        const photoUri = response?.assets?.[0]?.uri;
        const asset = response?.assets?.[0];
        if (!photoUri) return;
        if (asset?.base64) {
          setFieldValue(
            "imageBase64",
            `${
              resData?.success === 1 || resData?.success === "1"
                ? "punchOut.jpeg"
                : "punchIn.jpeg"
            }; data:${asset?.type};base64,${asset?.base64}`,
          );
        }
        setStatusImage(photoUri);
        setTimeout(() => {
          handleSubmit();
        }, 1000);
      },
    );
  };

  const handleStatusToggle = async (
    setFieldValue: (field: keyof AttendanceFormValues, value: any) => void,
    handleSubmit: () => void,
  ) => {
    const enabled = await DeviceInfo.isLocationEnabled();
    if (!enabled) {
      setBlocked(false);
      setLocationLoading(false);
      setAttendanceDone(false);
      setLocationAlertVisible(true);
      return;
    } else {
      setLocationAlertVisible(false);
    }
    setBlockAction(true);
    if (locationLoading) return;

    const hasPermission = await requestCameraAndLocationPermission();
    if (!hasPermission) {
      pendingCameraAction.current = { setFieldValue, handleSubmit };
      setAlertConfig({
        title: t("errors.permissionRequired"),
        message: t("errors.cameraLocationPermission"),
        type: "error",
      });
      setModalClose(false);
      setAlertVisible(true);
      setIsSettingVisible(true);

      setBlockAction(false);
      return;
    }

    setBlocked(false);
    setLocationLoading(true);

    const getLocationWithRetry = () => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position?.coords;
          setUserLocation({ latitude, longitude });
          setFieldValue("latitude", String(latitude));
          setFieldValue("longitude", String(longitude));
          openCamera(setFieldValue, handleSubmit);
        },
        (error) => {
          setAlertConfig({
            title: t("errors.locationError"),
            message: error?.message || t("msg.msg5"),
            type: "error",
          });
          setAlertVisible(true);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    };

    getLocationWithRetry();
  };

  const formatName = (name = "") =>
    name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const animProfile = useRef(new Animated.Value(20)).current;
  const animName = useRef(new Animated.Value(20)).current;
  const animRemark = useRef(new Animated.Value(20)).current;
  const animImage = useRef(new Animated.Value(20)).current;
  const animButton = useRef(new Animated.Value(20)).current;

  const fadeProfile = useRef(new Animated.Value(0)).current;
  const fadeName = useRef(new Animated.Value(0)).current;
  const fadeRemark = useRef(new Animated.Value(0)).current;
  const fadeImage = useRef(new Animated.Value(0)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(animProfile, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeProfile, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(animName, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeName, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(animRemark, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeRemark, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(animImage, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeImage, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(animButton, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeButton, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View
      style={{
        width: "100%",
        padding: 16,
        // backgroundColor: theme === 'dark' ? 'black' : 'white'
      }}
    >
      <Formik
        initialValues={{
          name: user?.name,
          latitude: userLocation ? String(userLocation?.latitude) : "",
          longitude: userLocation ? String(userLocation?.longitude) : "",
          remark: "",
          dateTime: new Date().toISOString(),
          imageBase64: "",
        }}
        validationSchema={Yup.object({
          name: Yup.string().required(t("attendance.nameRequired")),
          longitude: Yup.string().optional(),
          remark: Yup.string().optional(),
          dateTime: Yup.string().optional(),
          imageBase64: Yup.string().required(t("msg.msg6")),
        })}
        onSubmit={(values) => {
          dispatch(
            markAttendanceThunk({
              rawData: values,
              type:
                resData?.success === 1 || resData?.success === "1"
                  ? false
                  : true,
              user,
              id:
                resData?.success === 1 || resData?.success === "1"
                  ? resData?.id
                  : "0",
            }),
          )
            .unwrap()
            .then((res) => {
              if(resData?.success === 1 || resData?.success === "1"){
                dispatch(updateAttendanceState(true));
              }else{
                dispatch(updateAttendanceState(false));
              }
              setAttendanceDone(true);
              setAlertConfig({
                title: t("title.title3"),
                message: t("msg.msg7"),
                type: "success",
              });
              setAlertVisible(true);
              setLocationLoading(false);
              setBlockAction(false);

              setTimeout(() => {
                 setAlertVisible(false);

                setAlertMapConfig({
                  title: "Location tracked status",
                  message:
                    !isAttendanceDone
                      ? "You will be tracked until Punch Out"
                      : "tracked stop",
                  type: 'location',
                });
                setAlertMapVisible(true);
              }, 1100);
            })
            .catch((err) => {
              setAttendanceDone(false);
              setAlertConfig({
                title: t("title.title1"),
                message: err || t("msg.msg4"),
                type: "error",
              });
              setAlertVisible(true);
              setLocationLoading(false);
              setBlockAction(false);
            });
        }}
      >
        {({ values, errors, touched, setFieldValue, handleSubmit }) => (
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: theme === "dark" ? "black" : "transparent",
              },
            ]}
          >
            <View style={styles.profileRow}>
              <View style={styles.imageCol}>
                {`${baseLink}/FileUpload/1/UserMaster/${user?.id}/profileimage.jpeg` ? (
                  <TouchableOpacity
                    onPress={() => {
                      setImg(
                        `${baseLink}/FileUpload/1/UserMaster/${user?.id}/profileimage.jpeg`,
                      );
                      setShowModal(true);
                    }}
                  >
                    <Animated.View
                      style={{
                        opacity: fadeProfile,
                        transform: [{ translateY: animProfile }],
                      }}
                    >
                      <View style={styles.profileRow}>
                        <ProfileImage
                          userId={user?.id}
                          baseLink={baseLink}
                          userName={firstLetterUpperCase(user?.name || "")}
                        />
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.profileAvatar,
                      {
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
                      },
                    ]}
                  >
                    <Animated.View
                      style={{
                        opacity: fadeName,
                        transform: [{ translateY: animName }],
                      }}
                    >
                      <TranslatedText
                        text={firstLetterUpperCase(user?.name || "")}
                        numberOfLines={1}
                        style={{
                          color: ERP_COLOR_CODE.ERP_WHITE,
                          fontWeight: "bold",
                          fontSize: 26,
                        }}
                      ></TranslatedText>
                    </Animated.View>
                  </View>
                )}
              </View>
            </View>

            <View style={{}}>
              <Animated.View
                style={{
                  opacity: fadeRemark,
                  transform: [{ translateY: animRemark }],
                }}
              >
                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.label,
                      theme === "dark" && {
                        color: "white",
                      },
                    ]}
                  >
                    {t("attendance.employeeName")}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputReadonly,
                      theme === "dark" && {
                        borderWidth: 1,
                        borderColor: "white",
                        color: "black",
                        backgroundColor: "black",
                      },
                      { backgroundColor: ERP_COLOR_CODE.ERP_BORDER_LINE },
                    ]}
                    value={formatName(values?.name)}
                    editable={false}
                  />
                  {touched?.name && errors?.name ? (
                    <TranslatedText
                      numberOfLines={1}
                      text={errors?.name}
                      style={styles.errorText}
                    ></TranslatedText>
                  ) : null}
                </View>
                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.label,
                      theme === "dark" && {
                        color: "white",
                      },
                    ]}
                  >
                    {resData?.success === 1 || resData?.success === "1"
                      ? t("attendance.outremark")
                      : t("attendance.remark")}
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      { minHeight: 100, textAlignVertical: "top" },
                      theme === "dark" && {
                        borderWidth: 1,
                        borderColor: "white",
                        color: "white",
                        backgroundColor: "black",
                      },
                    ]}
                    placeholderTextColor={theme === "dark" ? "white" : "black"}
                    value={values?.remark}
                    onChangeText={(text) => setFieldValue("remark", text)}
                    placeholder={t("attendance.enterRemark")}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </Animated.View>
              {statusImage && (
                <View>
                  <Image
                    source={{ uri: statusImage }}
                    style={styles.selfyAvatar}
                  />
                  <Text style={styles.imageLabel}>
                    {t("attendance.capturedPhoto")}
                  </Text>
                </View>
              )}
              <Animated.View
                style={{
                  opacity: fadeButton,
                  transform: [{ translateY: animButton }],
                }}
              >
                <View>
                  <SlideButton
                    label={
                      resData?.success === 1 || resData?.success === "1"
                        ? `${t("text.text3")} ${t("attendance.checkOut")}`
                        : `${t("text.text3")} ${t("attendance.checkIn")}`
                    }
                    successColor={
                      resData?.success === 1 || resData?.success === "1"
                        ? ERP_COLOR_CODE.ERP_ERROR
                        : ERP_COLOR_CODE.ERP_APP_COLOR
                    }
                    loading={locationLoading}
                    completed={attendanceDone}
                    blocked={blocked}
                    onSlideSuccess={() =>
                      handleStatusToggle(setFieldValue, handleSubmit)
                    }
                  />
                </View>
              </Animated.View>
            </View>
          </View>
        )}
      </Formik>

      <ImageBottomSheetModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        imageUrl={img}
      />

      <CustomAlert
        visible={alertLocationVisible}
        title={t("title.title4")}
        message={t("msg.msg8")}
        type={"error"}
        onClose={() => {
          setBlocked(true);
          setAlertVisible(false);
          setTimeout(() => {
            setBlocked(false);
          }, 1000);
          setLocationLoading(false);
          setAttendanceDone(false);
          setLocationAlertVisible(false);
        }}
        actionLoader={undefined}
        isSettingVisible={false}
        closeHide={undefined}
      />

      <CustomAlert
        visible={alertMapVisible}
        title={alertMapConfig?.title}
        message={alertMapConfig?.message}
        type={alertMapConfig?.type}
        onClose={() => {
          navigation?.goBack();
          setAlertMapVisible(false);
          dispatch(setReloadApp());
        }}
        actionLoader={undefined}
        isSettingVisible={false}
        closeHide={undefined}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig?.title}
        message={alertConfig?.message}
        type={alertConfig?.type}
        onClose={() => {
          if (!modalClose) {
            if (attendanceDone) {
              navigation?.goBack();
              setAlertVisible(false);
            } else {
              setBlocked(true);
              setAlertVisible(false);
              setTimeout(() => {
                setBlocked(false);
              }, 1000);
            }
          }
        }}
        actionLoader={undefined}
        isSettingVisible={isSettingVisible}
        closeHide={undefined}
      />
    </View>
  );
};

export default AttendanceForm;

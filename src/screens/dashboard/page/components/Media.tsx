import MaterialIcons from '@react-native-vector-icons/material-icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Image,
  Dimensions,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PanResponder,
  AppState,
} from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import CustomAlert from '../../../../components/alert/CustomAlert';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import { useAppSelector } from '../../../../store/hooks';
import { useTranslation } from 'react-i18next';

const Media = ({ isValidate, item, handleAttachment, infoData, baseLink, isFromNew }: any) => {
  const {t} = useTranslation()
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [modalClose, setModalClose] = useState(false);
  const [loadingSmall, setLoadingSmall] = useState(false);
  const [loadingLarge, setLoadingLarge] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  const [alertVisible, setAlertVisible] = useState(false);
  const [isSettingVisible, setIsSettingVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
  });

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslate = useRef({ x: 0, y: 0 });
  const theme = useAppSelector(state => state?.theme.mode);

  const pendingCameraAction = useRef(false);
  const appState = useRef(AppState.currentState);

  const getImageUri = (type: 'small' | 'large') => {
    const base =
      imageUri ||
      `${baseLink}fileupload/1/${infoData?.tableName}/${infoData?.id}/${type === 'small' ? `d_${item?.text}` : item?.text
      }`;
     return `${base}?cb=${cacheBuster}`;
  };

  // -------------------- Permissions --------------------
  const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    try {
      let permission;

      if (type === 'camera') {
        permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
      } else {
        // Gallery / Photos
        if (Platform.OS === 'ios') {
          permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
        } 
        // else {
        //   // Android 13+
        //   if (Platform.Version >= 33) {
        //     permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        //   } else {
        //     permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        //   }
        // }
      }

      let result = await check(permission);

      if (result === RESULTS.GRANTED) return true;

      if (result === RESULTS.DENIED) {
        result = await request(permission);
        if (result === RESULTS.GRANTED) return true;
      }

      if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
        setAlertConfig({
          title: `${type === 'camera' ? 'Camera' : 'Gallery'} ${t('text28')}`,
          message: `${t('text29')} ${type === 'camera' ? 'camera' : 'gallery'} ${t('text30')}`,
          type: 'error',
        });
        setModalClose(true);
        setIsSettingVisible(true);
        setAlertVisible(true);

        if (type === 'camera') pendingCameraAction.current = true; // Track if camera was pending
        return false;
      }

      return result === RESULTS.GRANTED;
    } catch (error) {
       return false;
    }
  };

  // -------------------- AppState listener --------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        pendingCameraAction.current
      ) {
        const granted = await requestPermission('camera');
        if (granted) {
          setIsSettingVisible(false);
          setAlertVisible(false);
          pendingCameraAction.current = false;
          launchCamera({ mediaType: 'photo', quality: 0.5, includeBase64: true }, response => {
            if (response.assets && response.assets.length > 0) {
              const asset: Asset = response.assets[0];
              setImageUri(asset.uri || null);
              setCacheBuster(Date.now());
              handleAttachment(
                `${item?.field}.jpeg; data:${asset.type};base64,${asset.base64}`,
                item.field,
              );
            }
          });
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  // -------------------- Render Media Options --------------------
  const renderMedia = () => {
    if (item?.ctltype === 'IMAGE') {
      return [
        {
          text: 'Camera',
          icon: 'photo-camera',
          onPress: async () => {
            const granted = await requestPermission('camera');
            if (!granted) return;

            launchCamera({ mediaType: 'photo', quality: 0.5, includeBase64: true ,cameraType: 'front'}, response => {
              if (response.assets && response.assets.length > 0) {
                const asset: Asset = response.assets[0];
                setImageUri(asset.uri || null);
                setCacheBuster(Date.now());
                handleAttachment(
                  `${item?.field}.jpeg; data:${asset.type};base64,${asset.base64}`,
                  item.field,
                );
              }
            });
          },
        },
      ];
    } else if (item?.ctltype === 'PHOTO') {
      return [
        {
          text: 'Camera',
          icon: 'photo-camera',
          onPress: async () => {
            const granted = await requestPermission('camera');
            if (!granted) return;

            launchCamera({ mediaType: 'photo', quality: 0.5, includeBase64: true , cameraType: 'front'}, response => {
              if (response.assets && response.assets.length > 0) {
                const asset: Asset = response.assets[0];
                setImageUri(asset.uri || null);
                setCacheBuster(Date.now());
                handleAttachment(
                  `${item?.field}.jpeg; data:${asset.type};base64,${asset.base64}`,
                  item.field,
                );
              }
            });
          },
        },
        {
          text: 'Gallery',
          icon: 'photo-library',
          onPress: async () => {
            const granted = await requestPermission('gallery');
            if (!granted) return;

            launchImageLibrary(
              { mediaType: 'photo', quality: 0.8, includeBase64: true },
              response => {
                if (response.assets && response.assets.length > 0) {
                  const asset: Asset = response.assets[0];
                  setImageUri(asset.uri || null);
                  setCacheBuster(Date.now());
                  handleAttachment(
                    `${item?.field}.jpeg; data:${asset.type};base64,${asset.base64}`,
                    item.field,
                  );
                }
              },
            );
          },
        },
      ];
    }
    return [];
  };

  const handleChooseImage = () => {
    setPickerModalVisible(true);
  };
  // -------------------- PanResponder & Zoom --------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gesture) => {
        if (gesture.numberActiveTouches === 1) {
          translateX.setValue(lastTranslate.current.x + gesture.dx);
          translateY.setValue(lastTranslate.current.y + gesture.dy);
        } else if (gesture.numberActiveTouches === 2) {
          const touches = evt.nativeEvent.touches;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (!lastScale.currentDistance) lastScale.currentDistance = distance;
          const scaleFactor = distance / lastScale.currentDistance;
          scale.setValue(Math.max(1, Math.min(3, lastScale.current * scaleFactor)));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        lastTranslate.current.x += gesture.dx;
        lastTranslate.current.y += gesture.dy;
        lastScale.current = scale.__getValue();
        lastScale.currentDistance = undefined;
      },
    }),
  ).current;

  const zoomIn = () => {
    scale.setValue(Math.min(3, scale.__getValue() + 0.2));
    lastScale.current = scale.__getValue();
  };

  const zoomOut = () => {
    scale.setValue(Math.max(1, scale.__getValue() - 0.2));
    lastScale.current = scale.__getValue();
  };

  // -------------------- JSX --------------------
  return (
    <>
      <View style={{ flexDirection: 'row' }}>
        <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}>{item?.fieldtitle}</Text>
        {item?.tooltip !== item?.fieldtitle && <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}> - ( {item?.tooltip} ) </Text>}
        {item?.mandatory === '1' && <Text style={{ color: ERP_COLOR_CODE.ERP_ERROR }}>*</Text>}
      </View>
      <View style={styles.imageWrapper}>
        <TouchableOpacity
          onPress={() => {
            if (isFromNew) return;
            setModalVisible(true);
          }}
        >
          <View style={[
            theme === 'dark' && {
              borderWidth: 1,
              borderColor: 'white'
            },
            { width: 100, height: 100, }]}>
            {loadingSmall && (
              <ActivityIndicator style={StyleSheet.absoluteFill} size="small" color={theme === 'dark' ? 'white' : 'black'} />
            )}
            <Image
              key={item.field}
              source={imageUri ? { uri: imageUri } : { uri: getImageUri('small') }}
              style={styles.imageThumb}
              onLoadStart={() => !imageUri && setLoadingSmall(true)}
              onLoadEnd={() => setLoadingSmall(false)}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleChooseImage} style={[styles.editBtn, theme === 'dark' && {
          borderWidth: 1,
          borderColor: 'white',
          backgroundColor: 'black'
        },]}>
          <MaterialIcons name={'edit'} color={theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_BLACK} size={20} />
        </TouchableOpacity>
      </View>

      {/* Fullscreen Image Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          scale.setValue(1);
          translateX.setValue(0);
          translateY.setValue(0);
          lastTranslate.current = { x: 0, y: 0 };
          lastScale.current = 1;
          setModalVisible(false);
        }}
      >
        <View style={styles.fullscreenModalOverlay}>
          <View style={styles.fullscreenModalContent}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                scale.setValue(1);
                translateX.setValue(0);
                translateY.setValue(0);
                lastTranslate.current = { x: 0, y: 0 };
                lastScale.current = 1;
                setModalVisible(false);
              }}
            >
              <MaterialIcons name="close" size={30} color={ERP_COLOR_CODE.ERP_WHITE} />
            </TouchableOpacity>

            {loadingLarge && (
              <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={ERP_COLOR_CODE.ERP_WHITE} />
            )}

            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                transform: [{ scale }, { translateX }, { translateY }],
              }}
              {...panResponder.panHandlers}
            >
              <Image
                source={{ uri: getImageUri('large') }}
                style={styles.fullscreenImage}
                resizeMode="contain"
                onLoadStart={() => setLoadingLarge(true)}
                onLoadEnd={() => setLoadingLarge(false)}
              />
            </Animated.View>

            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
                <MaterialIcons name="zoom-in" size={28} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
                <MaterialIcons name="zoom-out" size={28} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pickerModalVisible}
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'dark' && {
            borderWidth: 1,
            borderColor: 'white',
            backgroundColor: 'black'
          }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, theme === 'dark' && {
                color: 'white'
              }]}>{t('text31')}</Text>
              <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              {renderMedia().map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionCard, theme === 'dark' && {
                    backgroundColor: 'black',
                    borderWidth: 1,
                    borderColor: 'white'
                  }]}
                  onPress={async () => {
                    setPickerModalVisible(false);
                    await option.onPress();
                  }}
                >
                  <MaterialIcons name={option?.icon} size={36} color={theme === 'dark' ? 'white' : 'black'} />
                  <Text style={[styles.optionLabel, {
                    color: theme === 'dark' ? 'white' : 'black'
                  }]}>{option?.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert for permissions */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          if (!modalClose) {
            setAlertVisible(false);
          }
        } }
        isSettingVisible={isSettingVisible}
        actionLoader={undefined} closeHide={undefined}      />
    </>
  );
};
 const styles = StyleSheet.create({
  imageWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },

  label: {
    fontSize: 14,
    color: ERP_COLOR_CODE.ERP_333,
    marginBottom: 6,
    fontWeight: '600',
  },

  imageThumb: {
    borderWidth: 1,
    width: 100,
    height: 100,
  },

  editBtn: {
    height: 36,
    width: 36,
    borderRadius: 36,
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    position: 'absolute',
    bottom: 28,
    left: Dimensions.get('screen').width / 1.88,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  /* ---------- Bottom Sheet ---------- */

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContent: {
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    alignItems: 'center',
    maxHeight: '60%',
    width: '100%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 12,
  },

  optionCard: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },

  optionLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
  },

  /* ---------- FULLSCREEN IMAGE MODAL (IMPROVED) ---------- */

  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fullscreenModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fullscreenImage: {
    width: '100%',
    height: '100%',
  },

  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 20,

    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  zoomControls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 16,

    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },

  zoomBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


export default Media;

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Platform,
  Text,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Dimensions,
  Modal,
  ImageBackground,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import { styles } from './attendance_style';
import FullViewLoader from '../../../components/loader/FullViewLoader';
import ERPIcon from '../../../components/icon/ERPIcon';
import List from './components/List';
import AttendanceForm from './components/AttendanceForm';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { getLastPunchInThunk } from '../../../store/slices/attendance/thunk';
import ErrorMessage from '../../../components/error/Error';
import { formatDateForAPI, parseCustomDate } from '../../../utils/helpers';
import { ERP_COLOR_CODE } from '../../../utils/constants';
import useTranslations from '../../../hooks/useTranslations';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { ERP_GIF } from '../../../assets';
import { NativeModules } from 'react-native';
import TranslatedText from '../tabs/home/TranslatedText';
import { BackHandler } from 'react-native';

const AttendanceScreen = () => {
  const route = useRoute();
  const { isFor } = route?.params || '';
  console.log('route', route)
  const navigation = useNavigation<any>();
  const [isListVisible, setIsListVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state?.theme.mode);
  const { t } = useTranslations();

  const [resData, setResData] = useState<any>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [blockAction, setBlockAction] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [actionLoader, setActionLoader] = useState(false);
  const [error, setError] = useState<any>('');

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<null | {
    type: 'from' | 'to';
    show: boolean;
  }>(null);

  const getCurrentMonthRange = useCallback(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date();
    const fromDateStr = formatDateForAPI(firstDay);
    const toDateStr = formatDateForAPI(lastDay);
    setFromDate(fromDateStr);
    setToDate(toDateStr);
    return { fromDate: fromDateStr, toDate: toDateStr };
  }, []);

  const formattedMonth = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;

  const onChangeDate = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  useEffect(() => {
    if (isFor === 'MyAttendance') {
      setIsListVisible(true);
    } else {
      setIsListVisible(false);
    }
  }, [navigation])


  useLayoutEffect(() => {
    navigation.setOptions({
      title: isFor === 'MyAttendance' ? t('test25') : t('test26'),
      headerTitleAlign: 'left',
      headerTitleStyle: {
        color: '#FFFFFF',
      },
      headerBackTitle: '',
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
        
      },
      headerTintColor: '#fff',
      headerRight: () => (
        <>
          {/* {isListVisible && (
            <ERPIcon
              name="filter-alt"
              onPress={() => {
                if (!blockAction) {
                  setShowFilter(!showFilter);
                }
              }}
            />
          )} */}
          {isListVisible && (
            <ERPIcon
              name="date-range"
              onPress={() => {
                setShowDateFilter(!showDateFilter);
              }}
            />
          )}
          <ERPIcon
            isLoading={actionLoader}
            name="refresh"
            onPress={() => {
              setRefresh(!refresh);
              setActionLoader(!actionLoader);
            }}
          />
        </>
      ),
    });
  }, [
    navigation,
    isListVisible,
    showPicker,
    showFilter,
    blockAction,
    refresh,
    actionLoader,
    showDateFilter,
    theme,
  ]);

  useFocusEffect(
    useCallback(() => {
      // NativeModules.OrientationModule.disableLandscape();
      return () => {
      };
    }, [navigation])
  );

  const checkAttendance = () => {
    setIsLoading(true);
    dispatch(getLastPunchInThunk())
      .unwrap()
      .then(res => {
        setResData(res);

        setActionLoader(false);
        setError(null);
        setIsLoading(false);

      })
      .catch(err => {
        setActionLoader(false);
        setError(err);
        setIsLoading(false);

      });
  };

  useEffect(() => {
    getCurrentMonthRange();
    checkAttendance();
  }, [refresh, theme]);

  if (error && error !== '') {
    <ErrorMessage message={error} isShowTop ={false}/>;
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !selectedDate) {
      setShowDatePicker(null);
      return;
    }
    const { type } = showDatePicker!;
    const formattedDate = formatDateForAPI(selectedDate);

    if (type === 'to') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (fromDate) {
        const fromDateObj = new Date(fromDate.split('-').reverse().join('-'));
        if (selectedDate < fromDateObj) {
          Alert.alert(t("text.text24"), t("text.text25"), [
            { text: t("text.text26") },
          ]);
          setShowDatePicker(null);
          return;
        }
      }
      setToDate(formattedDate);
    } else {
      setFromDate(formattedDate);
      if (toDate) {
        const toDateObj = new Date(toDate.split('-').reverse().join('-'));
        if (selectedDate > toDateObj) {
          setToDate('');
        }
      }
    }
    setShowDatePicker(null);
  };

  if (isLoading) {
    return (
      <View
        style={{
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
          height: Dimensions.get('screen').height * 0.85,
        }}
      >
        <FullViewLoader />
      </View>
    )
  }
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <>
      
        <View
        style={[
          {
            height: Dimensions.get('screen').height,
            flex: 1,
            backgroundColor: 'white'
          },
         isListVisible && showDateFilter && {
            backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
          }, 
          theme === 'dark' && { backgroundColor: 'black' }]}
      >
        
        {isListVisible && showDateFilter && (
          <View style={[styles.dateContainer, theme === 'dark' && {
            backgroundColor: 'black'
          },

          ]}>
            <View style={[styles.dateRow, theme === 'dark' && {
              backgroundColor: 'black'
            },


            ]}>

              <TouchableOpacity
                onPress={() => setShowDatePicker({ type: 'from', show: true })}
                style={[styles.dateButton, theme === 'dark' && {
                  backgroundColor: 'black'
                }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons
                    name="calendar-today"
                    size={18}
                    color={theme === 'dark' ? '#fff' : "#000"}
                    style={{ marginRight: 8 }}
                  />
                  <TranslatedText 
                  text={fromDate || t("text.text27")}
                  numberOfLines={1}
                  style={[styles.dateButtonText,
                  {
                    color: theme === 'dark' ? '#fff' : "#000"

                  }
                  ]}></TranslatedText>
                </View>


              </TouchableOpacity>
            </View>
            <View style={[styles.dateRow, theme === 'dark' && {
              backgroundColor: 'black'
            }]}>

              <TouchableOpacity
                onPress={() => setShowDatePicker({ type: 'to', show: true })}
                style={[styles.dateButton, theme === 'dark' && {
                  backgroundColor: 'black'
                }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons
                    name="calendar-today"
                    size={18}
                    color={theme === 'dark' ? '#fff' : "#000"}
                    style={{ marginRight: 8 }}
                  />
                  <TranslatedText 
                  numberOfLines={1}
                  text={toDate || ''}
                  style={[styles.dateButtonText, {
                    color: theme === 'dark' ? '#fff' : "#000"

                  }]}></TranslatedText>
                </View>

              </TouchableOpacity>
            </View>
          </View>
        )}

        {showDatePicker?.show && Platform.OS === 'ios' && (
          <Modal transparent animationType="slide" statusBarTranslucent>
            <View style={styles.overlay}>
              <View style={[styles.sheet,
                            theme === 'dark' && {
                              borderWidth: 1,
                              borderColor: 'white'
                            }
                            ]}>
                              {/* Divider */}
                              <View style={[
                                theme === 'dark' && {
                                  overflow: 'hidden',
                                  borderColor: 'white',
                                },
                                {
              
                                  flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignContent: "center", alignItems: 'center'
                                }]}>
                                <Text style={{
                                  color: theme === 'dark' ? 'white' : 'black'
                                }}>{t('text27')}</Text>
                                <TouchableOpacity onPress={() => {
                                  setShowDatePicker(null);
              
              
                                }}>
                                  <MaterialIcons name='close' color={ 'black'} size={24} />
                                </TouchableOpacity>
                              </View>
                              <View style={styles.divider} />

                {/* Date Picker */}
                <DateTimePicker
                  value={
                    showDatePicker.type === 'from' && fromDate
                      ? parseCustomDate(fromDate)
                      : showDatePicker.type === 'to' && toDate
                        ? parseCustomDate(toDate)
                        : new Date()
                  }
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  style={styles.picker}
                />
              </View>
            </View>
          </Modal>

        )}

        {Platform.OS !== 'ios' && showDatePicker?.show && (
          <DateTimePicker
            value={
              showDatePicker?.type === 'from' && fromDate
                ? parseCustomDate(fromDate)
                : showDatePicker?.type === 'to' && toDate
                  ? parseCustomDate(toDate)
                  : new Date()
            }
            mode="date"
            display="spinner"
            is24Hour={false}
            onChange={handleDateChange}

          />
        )}
        {
          isListVisible ? <>

            <View style={{
              flex: 1,
              width: '100%',
              backgroundColor: theme === 'dark' ? 'black' :'white',
              height: '100%'
            }}>
               <List
                selectedMonth={formattedMonth}
                showFilter={showFilter}
                fromDate={fromDate}
                toDate={toDate}
              />
              {showPicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  is24Hour={false}
                  onChange={onChangeDate}
                />
              )}
            </View>
          </> : <>
            <ImageBackground
              source={ theme === 'dark' ? '' : ERP_GIF.BACK_IMG}
              resizeMode='cover'
              style={{
                height: Dimensions.get('screen').height * 0.85,
                flex: 1
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false} style={[styles.container, theme === 'dark' && { backgroundColor: 'black' }]}>
                <>
                   <AttendanceForm setBlockAction={setBlockAction} resData={resData} />
                </>
              </ScrollView>
            </ImageBackground>
          </>
        }

      </View>
      </>
    

    </TouchableWithoutFeedback>
  );
};

export default AttendanceScreen;

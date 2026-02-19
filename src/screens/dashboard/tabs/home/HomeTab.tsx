import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { styles } from './home_style';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import FullViewLoader from '../../../../components/loader/FullViewLoader';
import NoData from '../../../../components/no_data/NoData';
import ERPIcon from '../../../../components/icon/ERPIcon';
import { getERPAppConfigMenuThunk, getERPDashboardThunk, getERPMenuThunk, getERPPageThunk } from '../../../../store/slices/auth/thunk';
import ErrorMessage from '../../../../components/error/Error';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Footer from './Footer';
import PieChartSection from './chartData';

import { formatDateForAPI, parseCustomDate } from '../../../../utils/helpers';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomPicker from '../../page/components/CustomPicker';
import { setActiveDashboardBranch, setActiveDashboardBranchId, setActiveDashboardFromDate, setActiveDashboardToDate, setActiveDashboardType, setActiveDashboardTypeId, setDashboardLoading } from '../../../../store/slices/auth/authSlice';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Animated,
  TextInput,
  Alert,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { ERP_ICON } from '../../../../assets';
import { translateSingle } from '../../../../services/api/utils';
import TranslatedText from './TranslatedText';
// import { NativeModules } from 'react-native';

const { width } = Dimensions.get('screen');

const hasHtmlContent = (str: string) => {
  if (!str || typeof str !== 'string') return false;
  return /<([a-z]+)([^>]*?)>/i.test(str);
};

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const [controls, setControls] = useState<any[]>([]);
  const [controlsLoader, setControlsLoader] = useState<any>(false);

  const { dashboard, isDashboardLoading, isAuthenticated, error, user, attendanceDone } = useAppSelector(
    state => state.auth,
  );

  const TOTAL_TIME = 3 * 60; // 3 min in seconds

  const [remainingTime, setRemainingTime] = useState(TOTAL_TIME);

  const [loadingPageId, setLoadingPageId] = useState<any>(null);
  const [isRefresh, setIsRefresh] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const auth = useAppSelector(state => state?.auth);

    const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const [showDatePicker, setShowDatePicker] = useState<null | {
    type: 'from' | 'to';
    show: boolean;
  }>(null);

  const [visible, setVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const theme = useAppSelector(state => state?.theme.mode);
  const [actionLoader, setActionLoader] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredDashboard, setFilteredDashboard] = useState(dashboard);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const translateX = useRef(new Animated.Value(width)).current;

  const htmlItems = filteredDashboard.filter(item => hasHtmlContent(item.data));
  const emptyItems = filteredDashboard.filter(item => item?.data === '');

  const textItems = filteredDashboard.filter(item => item.data && !hasHtmlContent(item.data));

  console.log("filteredDashboard", filteredDashboard)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      const filtered = dashboard.filter(item =>
        (item?.name || '').toLowerCase().includes(searchText?.toLowerCase()),
      );
      setFilteredDashboard(filtered);
    }, 300);

    return () => {

      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchText, dashboard]);

  useFocusEffect(
    useCallback(() => {
      // NativeModules.OrientationModule.enableLandscape();
      dispatch(setActiveDashboardBranchId(''))
      dispatch(setActiveDashboardBranch(''))
      dispatch(setActiveDashboardType(''))
      dispatch(setActiveDashboardTypeId(''))
      setIsFilterVisible(false)
      setIsHorizontal(false)
      return () => {
        // NativeModules.OrientationModule.disableLandscape();
      };
    }, [isAuthenticated, navigation])
  );

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: -350,
        duration: 10000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);


  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,

      },
      headerBackTitle: '',
      headerTintColor: '#fff',
      headerTitle: () =>
        showSearch ? (
          <View style={{ width: width - 70, flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={true}
              placeholder={t('text83')}
              style={{
                flex: 1,
                backgroundColor: '#f0f0f0',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 36,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchText('');
              }}
            >
              <MaterialIcons  
                name="clear"
                size={24}
                color={ERP_COLOR_CODE.ERP_WHITE}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: ERP_COLOR_CODE.ERP_WHITE, fontSize: 16, fontWeight: '600' }}>
            {user?.companyName || ''}
          </Text>
        ),
      headerRight: () => (
        <>
          {!showSearch && (
            <>
              <Text style={{ color: '#fff', fontSize: 12 }}>
            Next refresh in {formatTime(remainingTime)}
          </Text>

              <ERPIcon
                name="refresh"
                onPress={() => {
                  setControlsLoader(true);
                  setActionLoader(true);
                  setIsRefresh(!isRefresh);
                  dispatch(getERPDashboardThunk({ branch: auth.dashboardBranch.trim(), type: auth.dashboardType.trim(), fd: auth.dashboardFromDate.trim(), td: auth.dashboardToDate.trim() }));
                  const timer = setTimeout(() => {
                    setActionLoader(false);
                    setControlsLoader(false);
                    dispatch(setDashboardLoading(false));
                  }, 3000);
                  return () => clearTimeout(timer);

                }}
                isLoading={actionLoader}
              />
              {dashboard.length > 5 && (
                <ERPIcon name="search" onPress={() => setShowSearch(true)} />
              )}
              <ERPIcon
                name={!isHorizontal ? 'list' : 'apps'}
                onPress={() => setIsHorizontal(prev => !prev)}
              />
              <ERPIcon
                name={isFilterVisible ? 'close' : 'filter-alt'}
                onPress={() => setIsFilterVisible(prev => !prev)}
              />
              {
                attendanceDone &&   
                <ERPIcon
                  color={attendanceDone ? 'green' : 'red'}
                  name={'location-on'}
                  onPress={() => {
                    navigation.navigate("LocationTrack")
                  }}
              />
              }
            
            </>
          )}
        </>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation?.openDrawer()}
          style={{ height: 46, width: 46, justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
          <ERPIcon extSize={24} isMenu={true} name="menu" onPress={() => navigation?.openDrawer()} />
        </TouchableOpacity>
      ),
    });
  }, [actionLoader, navigation, isHorizontal, isRefresh, showSearch, dashboard, searchText, filteredDashboard, isFilterVisible]);

    useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDashboard = () => {
      dispatch(getERPDashboardThunk({ branch: auth?.dashboardBranch.trim() || "", type: auth?.dashboardType.trim() || "", fd: auth?.dashboardFromDate.trim() || "", td: auth?.dashboardToDate.trim() || "" }));
      setRemainingTime(TOTAL_TIME); // reset timer on fetch
      setTimeout(() => setActionLoader(false), 100);
    };

    // initial call
    fetchDashboard();

    // API call every 3 min
    const apiInterval = setInterval(fetchDashboard, 3 * 60 * 1000);

    // countdown every second
    const countdownInterval = setInterval(() => {
      setRemainingTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(apiInterval);
      clearInterval(countdownInterval);
    };
  }, [isAuthenticated, dispatch]);

  useFocusEffect(
    useCallback(() => {

      let timer;

      if (isAuthenticated) {
        setLoadingPageId(true);
        // dispatch(getERPAppConfigMenuThunk());
        const params = { branch: '', type: '', fd: '', td: '' }
        dispatch(getERPDashboardThunk(params));
        dispatch(getERPMenuThunk());
        timer = setTimeout(() => {
          dispatch(setDashboardLoading(false));
        }, 3000);
      }
      // ✅ single cleanup function
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [isAuthenticated, dispatch])
  );

  const dummyUpcomingEvents = [];

  const dummyUpcomingBirthdays = [
    { id: 'b1', name: 'Amit Sharma', date: '28 sep 2025', type: 'Up-coming-Birthday' },
  ];

  const dummyUpcomingAnniversaries = [
    { id: 'w1', name: 'Rohit & Neha', date: '03 sep 2025', type: 'Up-coming-work-anniversary' },
  ];

  const todayEvents = [{ id: 't2', date: 'Today', title: 'UX Review', type: 'Event' }];
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const todayBirthdays = [];

  const todayAnniversaries = [];

  const dummyTasks = [
    {
      id: '1',
      title: 'Fix login bug',
      description: 'Check the API response and fix login issue',
      assignedTo: 'jr1',
      createdBy: 'senior1',
      status: 'pending',
      updatedAt: '2025-09-10T10:00:00Z',
    },
  ];
  const getInitials = (text?: string) => {
    if (!text) return '?';
    const trimmed = text?.trim();
    if (trimmed?.length === 0) return '?';
    return trimmed.slice(0, 2).toUpperCase();
  };

  const accentColors = ['#4C6FFF', '#00C2A8', '#FFB020', '#FF6B6B', '#9B59B6', '#20C997'];

  const pieChartData = filteredDashboard
    .filter(item => {
      const num = Number(item?.data);
      return item?.title !== 'Attendance Code' && item?.data !== '' && !isNaN(num) && num > 0;
    })
    .map((item, index) => ({
      value: Number(item?.data),
      color: accentColors[index % accentColors.length],
      text: item?.title,
    }));

  const openSheet = () => {
    setVisible(true);
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);


  const renderDashboardItem = ({ item, index, isFromHtml, isFromMenu }: any) => {
    return (
      <TouchableOpacity
        key={item?.id || index}
        style={[
          styles.dashboardItem,
          {
            paddingLeft: 4,
            marginHorizontal: 4,
            borderRadius: 8,
            width: isFromHtml ? '100%' : isHorizontal ? '100%' : '48%',
            flex: 1,
            borderLeftColor: accentColors[index % accentColors.length],
            borderWidth: 1,
            borderLeftWidth: 3,
            backgroundColor: theme === 'dark' ? 'black' : 'white'

          },
        ]}
        activeOpacity={0.7}
        onPress={async () => {
          if (item?.url.includes('.') || item?.url.includes('?') || item?.url.includes('/')) {
            navigation.navigate('Web', { item });
          } else {
            navigation.navigate('List', { item });
          }
        }}
      >
        <View
          style={{
            backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE,
            borderRadius: 8,
          }}
        >
          <View style={styles.dashboardItemContent}>
            <View style={styles.dashboardItemHeader}>
              <View style={styles.dashboardItemTopRow}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: accentColors[index % accentColors.length] },
                  ]}
                >
                  <MaterialIcons name={item?.image || 'widgets'} color={
                    'white'
                  } size={22} />
                  {/* <Text style={styles.iconText}>{getInitials(item?.name)}</Text> */}
                </View>
                <View style={styles.headerTextWrap}>
                  {/* <Text
                    style={[
                      styles.dashboardItemText,
                      {
                        color:
                          theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_BLACK,
                        flexShrink: 1,
                        includeFontPadding: false,
                        textAlignVertical: 'top',
                      },
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {isFromMenu
                      ?  translateSingle(item?.title) 
                      : !isHorizontal
                        ? item?.title.replace(' ', '\n')
                        : translateSingle(item?.title)}
                  </Text> */}
                  <TranslatedText
                    text={item?.title}
                    style={[
                      styles.dashboardItemText,
                      {
                        color: theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_BLACK,
                        flexShrink: 1,
                        includeFontPadding: false,
                        textAlignVertical: 'top',
                      },
                    ]}
                    numberOfLines={2}
                  />
                </View>
              </View>
            </View>

            <View style={{ marginVertical: item.data ? 4 : 0 }}>
              {loadingPageId === (item.id || String(index)) && (
                <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={ERP_COLOR_CODE.ERP_007AFF} />
                  <Text style={{ marginLeft: 8, color: ERP_COLOR_CODE.ERP_6C757D }}>
                    {t('text85')}
                  </Text>
                </View>
              )}
              {item.data ? (
                <View style={styles.dataContainer}>
                  <Footer
                    textColor={accentColors[index % accentColors.length]}
                    isFromMenu={isFromMenu}
                    isHorizontal={isHorizontal}
                    footer={item?.data}
                    index={index}
                    accentColors={accentColors}
                    isFromListPage={undefined} />
                </View>
              ) : (
                <View style={styles.dataContainer}>
                  <Text style={styles.dashboardItemData} numberOfLines={2}>
                    {'-'}
                  </Text>
                </View>
              )}
            </View>
            {item?.footer ? (
              <View style={{ marginTop: 4 }}>
                <Footer
                  textColor={accentColors[index % accentColors.length]}
                  isFromMenu={isFromMenu}
                  isHorizontal={isHorizontal}
                  footer={item?.footer}
                  index={index}
                  accentColors={accentColors}
                  isFromListPage={undefined} />
              </View>
            ) : (
              <Text
                style={{
                  color: accentColors[index % accentColors.length],
                }}
              >
                {'-'}
              </Text>
            )}
            {item?.footer || item.data ? (
              <> </>
            ) : (
              <View style={{ height: 12, width: 12, backgroundColor: '' }}></View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const scrollY = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const { fromDate: initialFromDate, toDate: initialToDate } = getCurrentMonthRange();

  }, [getCurrentMonthRange]);

  // useFocusEffect(
  //   useCallback(() => {
  //     const { fromDate: initialFromDate, toDate: initialToDate } = getCurrentMonthRange();
  //     // fetchListData(initialFromDate, initialToDate);
  //     return () => { };
  //   }, [getCurrentMonthRange,]),
  // );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event?.type === 'dismissed' || !selectedDate) {
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
          Alert.alert(t('text86'), t('text87'), [
            { text: t('text88') },
          ]);
          setShowDatePicker(null);
          return;
        }
      }
      setToDate(formattedDate);
      dispatch(setActiveDashboardToDate(formattedDate))
    } else {

      setFromDate(formattedDate);
      dispatch(setActiveDashboardFromDate(formattedDate))
      if (toDate) {
        const toDateObj = new Date(toDate.split('-').reverse().join('-'));
        if (selectedDate > toDateObj) {
          setToDate('');
        }
      }
    }
    setShowDatePicker(null);
  };

  const fetchPageData = useCallback(async () => {
    try {
      setControlsLoader(true);
      const parsed = await dispatch(
        getERPPageThunk({ page: 'Dashboard', id: "" }),
      ).unwrap();
      const pageControls = Array.isArray(parsed?.pagectl) ? parsed?.pagectl : [];
      const normalizedControls = pageControls?.map(c => ({
        ...c,
        disabled: String(c?.disabled ?? '0'),
        visible: String(c?.visible ?? '1'),
        mandatory: String(c?.mandatory ?? '0'),
      }));
      setControls(normalizedControls);
      setControlsLoader(false);
    } catch (e: any) {
    } finally {
      setLoadingPageId(null);
      setTimeout(() => {
        setActionLoader(false);
      }, 10);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchPageData();
  }, []);



  useEffect(() => {
    dispatch(getERPDashboardThunk({ branch: auth?.dashboardBranch.trim() || "", type: auth?.dashboardType.trim() || "", fd: auth?.dashboardFromDate.trim() || "", td: auth?.dashboardToDate.trim() || "" }));
    const timer = setTimeout(() => {
      dispatch(setDashboardLoading(false));
    }, 3000);
    return () => clearTimeout(timer);

  }, [auth.dashboardBranch, auth.dashboardType, auth.dashboardFromDate, auth.dashboardToDate])

  function SmallItem({ left, primary, secondary, type }) {
    return (
      <TouchableOpacity style={[styles.itemRow, theme === 'dark' && {
        backgroundColor: 'black'
      }]} activeOpacity={0.8}>
        <View style={[styles.avatar, {
          borderWidth: 1,
          borderColor: 'white'
        }]}>{left}</View>
        <View style={styles.itemText}>
          <Text numberOfLines={1} style={[styles.itemPrimary, theme === 'dark' && {
            color: 'white'
          }]}>
            {primary}
          </Text>
          <Text style={[styles.itemType, theme === 'dark' && {
            color: 'white'
          }]}>{type}</Text>
        </View>
        <View>
          <Text style={[styles.itemSecondary, theme === 'dark' && {
            color: 'white'
          }]}>{secondary}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (isDashboardLoading) return <FullViewLoader isShowTop={theme === 'dark' ? false : true}/>
  if (!actionLoader && filteredDashboard?.length === 0) {
    return <View
      style={{
        height: Dimensions.get('screen').height * 0.75,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: theme === 'dark' ? 'black' : 'white',
      }}
    >

      <View
        style={{
          backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
          padding: 12,
          // width: width,
          borderBottomRightRadius: 24,
          borderBottomLeftRadius: 24,
          borderColor: 'white',
          width: '100%',
          marginBottom: 10
        }}
      >
        <Animated.View
          style={{
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            gap: 8,
            flexDirection: 'row',
            // transform: [{ translateX }],
          }}
        >
          <MaterialIcons name="business" size={24} color={"#FFF"} />
          <Text
            numberOfLines={1}
            style={{
              color: "#FFF",
              fontWeight: '600',
              fontSize: 16,
              maxWidth: 280,
            }}
          >
            {user?.companyName || ''}
          </Text>

        </Animated.View>


        {/* Branch + Type Buttons */}
        {
          isFilterVisible && <>
            <View style={[styles.dateContainer, {
              marginTop: 8
            }]}>
              {/* Dynamic Render Date Fields */}
              {isFilterVisible && controls
                .filter((x) => x.ctltype === "DATE")
                .map((item, index) => (
                  <View key={index} style={[styles.dateRow, {
                    width: '48%'
                  }]}>
                    <TouchableOpacity
                      onPress={() =>
                        setShowDatePicker({ type: item.field === "fromdate" ? "from" : "to", show: true })
                      }
                      style={[styles.dateButton, {
                        width: '98%'
                      }]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialIcons
                          name="calendar-today"
                          size={18}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.dateButtonText, { color: "#FFF" }]}>
                          {item.field === "fromdate"
                            ? fromDate || "Select From Date"
                            : toDate || "Select To Date"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {index === 0 && <View style={{ height: 1, width: 8 }} />}
                  </View>
                ))}
            </View>

            {
              isFilterVisible &&


              <View style={{
                flexDirection: "row", justifyContent: "space-between", marginTop: 4
              }}>
                {
                  controls
                    .filter((x) => x.ctltype !== "DATE" && x.field !== 'userid')
                    .map((item, index) => (<>
                      <View style={{ width: '49.5%' }}>
                        <CustomPicker
                          isForceOpen={false}
                          isValidate={false}
                          label={item.title}
                          selectedValue={() => { }}
                          dtext={item?.title === 'Branch' ? auth?.dashboardBranch || item.dtext : auth.dashboardType || item?.dtext}
                          onValueChange={(i) => {
                            if (item?.title === 'Branch') {
                              dispatch(setActiveDashboardBranchId(i?.value?.toString()))
                              dispatch(setActiveDashboardBranch(i?.name))
                            } else {
                              dispatch(setActiveDashboardType(i?.name))
                              dispatch(setActiveDashboardTypeId(i?.value?.toString()))
                            }
                            setIsFilterVisible(false)
                          }}
                          options={[]}
                          item={item}
                          errors={null}
                          formValues={null}
                        />
                      </View>
                    </>))
                }
              </View>
            }
          </>
        }
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
                  }}>{t('text89')}</Text>
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
                    showDatePicker.type === "from" && fromDate
                      ? parseCustomDate(fromDate)
                      : showDatePicker.type === "to" && toDate
                        ? parseCustomDate(toDate)
                        : new Date()
                  }
                  themeVariant="light"
                  mode="date"
                  display='spinner'
                  onChange={handleDateChange}

                />
              </View>
            </View>
          </Modal>

        )}

        {/* Date Picker */}
        {Platform.OS !== 'ios' && showDatePicker?.show && (
          <DateTimePicker
            value={
              showDatePicker.type === "from" && fromDate
                ? parseCustomDate(fromDate)
                : showDatePicker.type === "to" && toDate
                  ? parseCustomDate(toDate)
                  : new Date()
            }
            mode="date"
            onChange={handleDateChange}
          />
        )}
      </View>

      <NoData isShowTop = {false} />

    </View>
  };

  return (
    <View
      style={{
        height: Dimensions.get('screen').height,
        flex: 1,
        backgroundColor: isDashboardLoading ? 'black' : theme === 'dark' ? 'black' : 'white'
      }}
    >

      <View
        style={{
          backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
          padding: 12,
          borderBottomRightRadius: 24,
          borderBottomLeftRadius: 24,
        }}
      >
        

        {
          isFilterVisible && <>
            <View style={[styles.dateContainer, {
              marginTop: 8
            }]}>
              {isFilterVisible && controls
                .filter((x) => x.ctltype === "DATE")
                .map((item, index) => (
                  <View key={index} style={[styles.dateRow, {
                    width: '48%'
                  }]}>
                    <TouchableOpacity
                      onPress={() =>
                        setShowDatePicker({ type: item.field === "fromdate" ? "from" : "to", show: true })
                      }
                      style={[styles.dateButton, {
                        width: '98%'
                      }]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <MaterialIcons
                          name="calendar-today"
                          size={18}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <TranslatedText
                        numberOfLines={1}
                        text={item.field === "fromdate"
                            ? fromDate || "Select From Date"
                            : toDate || "Select To Date"}
                        style={[styles.dateButtonText, { color: "#FFF" }]}>
                          
                        </TranslatedText>
                      </View>
                    </TouchableOpacity>
                    {index === 0 && <View style={{ height: 1, width: 8 }} />}
                  </View>
                ))}
            </View>

            {
              isFilterVisible &&
              <View style={{
                flexDirection: "row", justifyContent: "space-between", marginTop: 4
              }}>
                {
                  controls
                    .filter((x) => x.ctltype !== "DATE" && x.field !== 'userid')
                    .map((item, index) => (<>
                      <View style={{ width: '49.5%' }}>
                        <CustomPicker
                          isForceOpen={false}
                          isValidate={false}
                          label={item.title}
                          selectedValue={() => { }}
                          dtext={item?.title === 'Branch' ? auth?.dashboardBranch || item.dtext : auth.dashboardType || item?.dtext}
                          onValueChange={(i) => {
                            if (item?.title === 'Branch') {
                              dispatch(setActiveDashboardBranchId(i?.value?.toString()))
                              dispatch(setActiveDashboardBranch(i?.name))
                            } else {
                              dispatch(setActiveDashboardType(i?.name))
                              dispatch(setActiveDashboardTypeId(i?.value?.toString()))
                            }
                          }}
                          options={[]}
                          item={item}
                          errors={null}
                          formValues={null}
                        />
                      </View>
                    </>))
                }
              </View>
            }
          </>
        }

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
                  }}>{t('text89')}</Text>
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
                  is24Hour={false}
                  onChange={handleDateChange}
                  style={[styles.picker, {
                    backgroundColor: 'white',
                  }]}
                />
              </View>
            </View>
          </Modal>
        )}

        {Platform.OS !== 'ios' && showDatePicker?.show && (
          <DateTimePicker
            value={
              showDatePicker.type === "from" && fromDate
                ? parseCustomDate(fromDate)
                : showDatePicker.type === "to" && toDate
                  ? parseCustomDate(toDate)
                  : new Date()
            }
            mode='date'
            display={'spinner'}
            is24Hour={false}
            onChange={handleDateChange}

          />
        )}
      </View>
      <FlatList
        data={['']}
        showsVerticalScrollIndicator={false}
        renderItem={() => {
          return (<>
            {controlsLoader ? (
              <View
                style={{
                  height: Dimensions.get('screen').height * 0.75,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: theme === 'dark' ? 'black' : 'white',
                }}
              >
                <FullViewLoader />
              </View>
            ) : error ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: theme === 'dark' ? 'black' : 'white',
                }}
              >
                <ErrorMessage message={error} isShowTop ={false} />{' '}
              </View>
            ) : controls?.length === 0 && !isDashboardLoading ? (
              <View
                style={{
                  height: Dimensions.get('screen').height,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: theme === 'dark' ? 'black' : 'white',
                }}
              >
                <NoData isShowTop = {false}/>
              </View>
            ) : (
              <View style={{
                backgroundColor: theme === 'dark' ? 'black' : 'white',
                flex: 1
              }}>
                <>
                  <Animated.FlatList
                    showsVerticalScrollIndicator={false}
                    data={['']}
                    keyExtractor={(_, i) => i.toString()}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                      useNativeDriver: true,
                    })}
                    scrollEventThrottle={16}
                    renderItem={() => (
                      <View
                        style={{
                          backgroundColor: theme === 'dark' ? 'black' : 'white',
                          flex: 1
                        }}
                      >
                        <View>
                          {pieChartData.length > 0 && (
                            <PieChartSection pieChartData={pieChartData} navigation={navigation} t={t} />
                          )}
                          {pieChartData.length === 0 && <View style={{ marginTop: 12 }} />}
                        </View>
                        <View style={styles.dashboardSection}>
                          <FlatList
                            key={`${isHorizontal}`}
                            keyboardShouldPersistTaps="handled"
                            data={[...textItems, ...emptyItems]}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={isHorizontal ? 1 : 4}
                            columnWrapperStyle={!isHorizontal ? styles.columnWrapper : undefined}
                            renderItem={
                              ({ item, index }) =>
                                renderDashboardItem({ item, index, isFromHtml: false, isFromMenu: false })
                            }
                            showsVerticalScrollIndicator={false}
                          />
                        </View>

                        <View style={styles.dashboardSection}>
                          <FlatList
                            key={`${isHorizontal}`}
                            keyboardShouldPersistTaps="handled"
                            data={htmlItems}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={
                              ({ item, index }) =>
                                renderDashboardItem({ item, index, isFromHtml: true, isFromMenu: true })
                            }
                            showsVerticalScrollIndicator={false}
                          />
                        </View>
                       
                      </View>
                    )}
                  />
                </>
              </View>
            )}
          </>
          )
        }}
      />
    </View>
  );
};

export default HomeScreen;

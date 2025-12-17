import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { styles } from './home_style';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import FullViewLoader from '../../../../components/loader/FullViewLoader';
import NoData from '../../../../components/no_data/NoData';
import ERPIcon from '../../../../components/icon/ERPIcon';
import { getERPDashboardThunk } from '../../../../store/slices/auth/thunk';
import ErrorMessage from '../../../../components/error/Error';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import TaskListScreen from '../../../task_module/task_list/TaskListScreen';
import TaskDetailsBottomSheet from '../../../task_module/task_details/TaskDetailsScreen';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Footer from './Footer';
import PieChartSection from './chartData';
const { width } = Dimensions.get('screen');

const hasHtmlContent = (str: string) => {
  if (!str || typeof str !== 'string') return false;
  return /<([a-z]+)([^>]*?)>/i.test(str);
};

const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const { dashboard, isDashboardLoading, isAuthenticated, error, user } = useAppSelector(
    state => state.auth,
  );
  console.log('🚀 ~ HomeScreen ~ dashboard:', dashboard);
  const [loadingPageId, setLoadingPageId] = useState<any>(null);
  const [isRefresh, setIsRefresh] = useState<boolean>(false);

  const theme = useAppSelector(state => state?.theme);
  const [actionLoader, setActionLoader] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const translateX = useRef(new Animated.Value(width)).current;

  const htmlItems = dashboard.filter(item => hasHtmlContent(item.data));
  const emptyItems = dashboard.filter(item => item?.data === '');

  const textItems = dashboard.filter(item => item.data && !hasHtmlContent(item.data));

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
      headerTitle: () => (
        <>
          <Text style={{ color: ERP_COLOR_CODE.ERP_WHITE, fontSize: 18, fontWeight: '600' }}>
            {user?.companyName || ''}
          </Text>
        </>
      ),
      headerRight: () => (
        <>
          <ERPIcon
            name="refresh"
            onPress={() => {
              setActionLoader(true);
              setIsRefresh(!isRefresh);
              dispatch(getERPDashboardThunk());
              setTimeout(() => {
                setActionLoader(false);
              }, 100);
            }}
            isLoading={actionLoader}
          />
          <ERPIcon
            name={!isHorizontal ? 'list' : 'apps'}
            onPress={() => setIsHorizontal(prev => !prev)}
          />
        </>
      ),
      headerLeft: () => (
        <>
          <ERPIcon
            extSize={24}
            isMenu={true}
            name="menu"
            onPress={() => navigation?.openDrawer()}
          />
        </>
      ),
    });
  }, [navigation, isRefresh, actionLoader, isHorizontal]);

  useFocusEffect(
    useCallback(() => {
      setLoadingPageId(true);

      if (isAuthenticated) {
        dispatch(getERPDashboardThunk());
      }

      return () => {};
    }, [isAuthenticated, dispatch]),
  );

  const getInitials = (text?: string) => {
    if (!text) return '?';
    const trimmed = text?.trim();
    if (trimmed?.length === 0) return '?';
    return trimmed.slice(0, 2).toUpperCase();
  };

  const accentColors = ['#4C6FFF', '#00C2A8', '#FFB020', '#FF6B6B', '#9B59B6', '#20C997'];

  const pieChartData = dashboard
    .filter(item => {
      const num = Number(item?.data);
      return item?.title !== 'Attendance Code' && item?.data !== '' && !isNaN(num) && num > 0;
    })
    .map((item, index) => ({
      value: Number(item?.data),
      color: accentColors[index % accentColors.length],
      text: item?.title,
    }));

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
            borderLeftWidth: 3,
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
            backgroundColor: theme === 'dark' ? ERP_COLOR_CODE.ERP_333 : ERP_COLOR_CODE.ERP_WHITE,
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
                  <Text style={styles.iconText}>{getInitials(item?.name)}</Text>
                </View>
                <View style={styles.headerTextWrap}>
                  <Text
                    style={[
                      styles.dashboardItemText,
                      {
                        color:
                          theme === 'dark' ? ERP_COLOR_CODE.ERP_WHITE : ERP_COLOR_CODE.ERP_BLACK,
                        flexShrink: 1,
                        includeFontPadding: false,
                        textAlignVertical: 'top',
                      },
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item?.title}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginVertical: item.data ? 4 : 0 }}>
              {loadingPageId === (item.id || String(index)) && (
                <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={ERP_COLOR_CODE.ERP_007AFF} />
                  <Text style={{ marginLeft: 8, color: ERP_COLOR_CODE.ERP_6C757D }}>
                    Loading page...
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
                  />
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
                />
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

  const dummyUpcomingEvents = [];

  const dummyUpcomingBirthdays = [
    { id: 'b1', name: 'Amit Sharma', date: '28 sep 2025', type: 'Up-coming-Birthday' },
  ];

  const dummyUpcomingAnniversaries = [
    { id: 'w1', name: 'Rohit & Neha', date: '03 sep 2025', type: 'Up-coming-work-anniversary' },
  ];

  const todayEvents = [{ id: 't2', date: 'Today', title: 'UX Review', type: 'Event' }];

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
  const scrollY = useRef(new Animated.Value(0)).current;

  function SmallItem({ left, primary, secondary, type }) {
    return (
      <TouchableOpacity style={styles.itemRow} activeOpacity={0.8}>
        <View style={styles.avatar}>{left}</View>
        <View style={styles.itemText}>
          <Text numberOfLines={1} style={styles.itemPrimary}>
            {primary}
          </Text>
          <Text style={styles.itemType}>{type}</Text>
        </View>
        <View>
          <Text style={styles.itemSecondary}>{secondary}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={theme === 'dark' ? styles.containerDark : styles.container}>
      {isDashboardLoading ? (
        <FullViewLoader />
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
          }}
        >
          <ErrorMessage message={error} />{' '}
        </View>
      ) : dashboard?.length === 0 && !isDashboardLoading ? (
        <NoData />
      ) : (
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
              <>
               <View style={{ marginTop: 12 }} />
                {/* Pie chart section */}
                {pieChartData.length > 0 && (
                  <PieChartSection pieChartData={pieChartData} navigation={navigation} t={t} />
                )}
                {pieChartData.length === 0 && <View style={{ marginTop: 12 }} />}
                {/* Dashboard items */}
                <View style={styles.dashboardSection}>
                  <FlatList
                    key={`${isHorizontal}`}
                    keyboardShouldPersistTaps="handled"
                    data={[...textItems, ...emptyItems]}
                    keyExtractor={item => item?.id}
                    numColumns={isHorizontal ? 1 : 2}
                    columnWrapperStyle={!isHorizontal ? styles.columnWrapper : undefined}
                    renderItem={
                      ({ item, index }) =>
                        renderDashboardItem({ item, index, isFromHtml: false, isFromMenu: false }) // 👈 custom prop passed here
                    }
                    showsVerticalScrollIndicator={false}
                  />
                </View>

                <View style={styles.dashboardSection}>
                  <FlatList
                    key={`${isHorizontal}`}
                    keyboardShouldPersistTaps="handled"
                    data={htmlItems}
                    keyExtractor={item => item?.id}
                    renderItem={
                      ({ item, index }) =>
                        renderDashboardItem({ item, index, isFromHtml: true, isFromMenu: true }) // 👈 custom prop passed here
                    }
                    showsVerticalScrollIndicator={false}
                  />
                </View>
               
                <View style={{ height: 10, width: 100 }} />
              </>
            )}
          />
        </>
      )}
    </View>
  );
};

export default HomeScreen;

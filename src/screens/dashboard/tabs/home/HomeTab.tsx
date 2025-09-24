import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';

import { styles } from './home_style';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import FullViewLoader from '../../../../components/loader/FullViewLoader';
import NoData from '../../../../components/no_data/NoData';
import ERPIcon from '../../../../components/icon/ERPIcon';
import { PieChart } from 'react-native-gifted-charts';
import { getERPDashboardThunk } from '../../../../store/slices/auth/thunk';
import ErrorMessage from '../../../../components/error/Error';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import { useTranslation } from 'react-i18next';
const HomeScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const { dashboard, isDashboardLoading, isAuthenticated, error, user } = useAppSelector(
    state => state.auth,
  );
  const [loadingPageId, setLoadingPageId] = useState<any>(null);
  const [isRefresh, setIsRefresh] = useState<boolean>(false);

  const theme = useAppSelector(state => state?.theme);
  const [actionLoader, setActionLoader] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
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

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     dispatch(getERPDashboardThunk());
  //   }, 120 * 1000);
  //   return () => clearInterval(intervalId);
  // }, [dispatch]);

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

  const renderDashboardItem = ({ item, index }: any) => {
    return (
      <TouchableOpacity
        key={item?.id || index}
        style={[
          styles.dashboardItem,
          {
            paddingLeft: 4,
            marginHorizontal: 4,
            backgroundColor: accentColors[index % accentColors.length],
            borderRadius: 8,
            width: isHorizontal ? '100%' : '48%',
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
            backgroundColor: theme === 'dark' ? '#333' : '#fff',
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
                        color: theme === 'dark' ? '#fff' : '#000',
                        flexShrink: 1,
                        includeFontPadding: false,
                        textAlignVertical: 'top',
                      },
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {!isHorizontal ? item?.title.replace(' ', '\n') : item?.title}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginVertical: item.data ? 4 : 0 }}>
              {loadingPageId === (item.id || String(index)) && (
                <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={{ marginLeft: 8, color: '#6C757D' }}>Loading page...</Text>
                </View>
              )}
              {item.data ? (
                <View style={styles.dataContainer}>
                  <Text style={styles.dashboardItemData} numberOfLines={2}>
                    {item?.data}
                  </Text>
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
              <Text
                style={{
                  color: accentColors[index % accentColors.length],
                }}
              >
                {item?.footer}
              </Text>
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

  const dummyUpcomingEvents = [
    { id: 'u1', date: '28 sep 2025', title: 'Product Launch', type: 'Up-coming-Event' },
  ];

  const dummyUpcomingBirthdays = [
    { id: 'b1', name: 'Amit Sharma', date: '28 sep 2025', type: 'Up-coming-Birthday' },
  ];

  const dummyUpcomingAnniversaries = [
    { id: 'w1', name: 'Rohit & Neha', date: '03 sep 2025', type: 'Up-coming-work-anniversary' },
  ];

  const todayEvents = [{ id: 't2', date: '28 sep 2025', title: 'UX Review', type: 'Event' }];

  const todayBirthdays = [
    { id: 'tb1', name: 'Karan Patel', date: '28 sep 2025', type: 'Today-birthday' },
  ];

  const todayAnniversaries = [
    { id: 'tw1', name: 'Meera & Sameer', date: '28 sep 2025', type: 'Today-anniversary' },
  ];

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
      <Text
        numberOfLines={1}
        style={{
          color: 'white',
          marginTop: 1,
          backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
          padding: 12,
          textAlign: 'center',
          borderBottomRightRadius: 24,
          borderBottomLeftRadius: 24,
        }}
      >
        {user?.companyName || ''}
      </Text>
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
      ) : dashboard?.length === 0 ? (
        <NoData />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={['']}
          renderItem={() => (
            <>
              {/* Pie chart section */}
              {dashboard?.length > 0 && (
                <View
                  style={{
                    borderColor: '#000',
                    borderBottomWidth: 0.4,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Web', { isFromChart: true })}
                    style={styles.chartContainer}
                  >
                    <PieChart
                      data={pieChartData}
                      donut
                      radius={90}
                      textSize={14}
                      innerRadius={80}
                      textColor="#000"
                      showValuesAsLabels
                      labelPosition="outside"
                      innerCircleColor="#fff"
                      centerLabelComponent={() => (
                        <Text
                          style={{
                            textAlign: 'center',
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: '#000',
                          }}
                        >
                          {t('home.dashboard')}
                        </Text>
                      )}
                    />
                  </TouchableOpacity>

                  {/* Legend */}
                  <View style={{ justifyContent: 'center', marginTop: 16 }}>
                    {pieChartData?.map((item, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginHorizontal: 8,
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: item.color,
                            marginRight: 6,
                          }}
                        />
                        <Text style={{ fontSize: 14, color: '#444' }}>
                          {item?.text}: {item?.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Dashboard items */}
              <View style={styles.dashboardSection}>
                <FlatList
                  key={`${isHorizontal}`}
                  keyboardShouldPersistTaps="handled"
                  data={dashboard}
                  keyExtractor={item => item?.id}
                  numColumns={isHorizontal ? 1 : 2}
                  columnWrapperStyle={!isHorizontal ? styles.columnWrapper : undefined}
                  renderItem={renderDashboardItem}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              <View style={styles.grid}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Events</Text>
                  <FlatList
                    data={todayEvents}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <SmallItem
                        left={<Text style={styles.avatarText}>T</Text>}
                        primary={item.title}
                        secondary={item.date}
                        type={item?.type}
                      />
                    )}
                  />

                  <FlatList
                    key={`${isHorizontal}`}
                    data={dummyUpcomingEvents}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <SmallItem
                        left={<Text style={styles.avatarText}>E</Text>}
                        primary={item.title}
                        secondary={item.date}
                        type={item?.type}
                      />
                    )}
                  />
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Birthday & Work-anniversary</Text>
                  <FlatList
                    data={todayBirthdays}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <SmallItem
                        left={
                          <Text style={styles.avatarText}>
                            {item.name
                              .split(' ')
                              .map(n => n[0])
                              .slice(0, 2)
                              .join('')}
                          </Text>
                        }
                        primary={item.name}
                        secondary={item.date}
                        type={item?.type}
                      />
                    )}
                  />

                  <FlatList
                    data={dummyUpcomingBirthdays}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <SmallItem
                        left={
                          <Text style={styles.avatarText}>
                            {item.name
                              .split(' ')
                              .map(n => n[0])
                              .slice(0, 2)
                              .join('')}
                          </Text>
                        }
                        primary={item.name}
                        secondary={item.date}
                        type={item?.type}
                      />
                    )}
                  />
                  <FlatList
                    data={todayAnniversaries}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <SmallItem
                        left={<Text style={styles.avatarText}>A</Text>}
                        primary={item.name}
                        secondary={item.date}
                        type={item?.type}
                      />
                    )}
                  />

                  <FlatList
                    data={dummyUpcomingAnniversaries}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <SmallItem
                        left={<Text style={styles.avatarText}>W</Text>}
                        primary={item.name}
                        secondary={item.date}
                        type={item?.type}
                      />
                    )}
                  />
                </View>
              </View>

              <View style={{ height: 10, width: 100 }} />
            </>
          )}
        />
      )}
    </View>
  );
};

export default HomeScreen;

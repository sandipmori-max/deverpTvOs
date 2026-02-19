import MaterialIcons from '@react-native-vector-icons/material-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  PanResponder,
} from 'react-native';
import NoData from '../../../../components/no_data/NoData';
import { PieChart } from 'react-native-gifted-charts';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { getERPListDataThunk } from '../../../../store/slices/auth/thunk';
import FullViewLoader from '../../../../components/loader/FullViewLoader';
import { useBaseLink } from '../../../../hooks/useBaseLink';
import { Calendar } from 'react-native-calendars';
import ErrorMessage from '../../../../components/error/Error';
import FastImage from 'react-native-fast-image';
import {
  formatTo12Hour,
  getWorkedHours,
  getWorkedHours2,
  isAfter830,
  isBefore830,
  isLatePunchIn,
  normalizeDate,
} from '../../../../utils/helpers';
import DetailsBottomSheet from './DetailsModal';
import useTranslations from '../../../../hooks/useTranslations';
import ImageBottomSheetModal from '../../../../components/bottomsheet/ImageBottomSheetModal';
import TranslatedText from '../../tabs/home/TranslatedText';

const styles = StyleSheet.create({
  recordCard: {
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    borderRadius: 4,
    padding: 8,
    marginVertical: 4,
    marginHorizontal: 12,
    borderWidth: 0.5,
    width: '100%',
  },
  recordAvatar: { width: 46, height: 46, borderRadius: 25 },
  recordName: { fontSize: 14 },
  recordDateTime: { fontWeight: '600', fontSize: 14, color: ERP_COLOR_CODE.ERP_BLACK },
  recordPunchTime: { fontSize: 14, color: ERP_COLOR_CODE.ERP_333 },
  statusBadgeRed: {
    backgroundColor: ERP_COLOR_CODE.ERP_ERROR,
    color: ERP_COLOR_CODE.ERP_WHITE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusBadgeBlue: {
    backgroundColor: '#a6bfc9ff',
    color: ERP_COLOR_CODE.ERP_WHITE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusBadgeGrey: {
    backgroundColor: '#dad1d1',
    color: ERP_COLOR_CODE.ERP_BLACK,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
});

const List = ({ selectedMonth, showFilter, fromDate, toDate }: any) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state?.theme.mode);
  const { t } = useTranslations();

  const [showImgModal, setShowImgModal] = useState(false);
  const [img, setImg] = useState('')

  const FILTERS = [
    { key: 'all', label: t("text.text9") },
    { key: 'leave', label: t("text.text10") },
    { key: 'leave_first_half', label: t("text.text11") },
    { key: 'leave_second_half', label: t("text.text12") },
    { key: 'late', label: t("text.text13") },
    { key: 'after_830', label: '8:30 >' },
    { key: 'before_830', label: '8:30 <' },
  ];

  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [listData, setListData] = useState<any[]>([]);
  const [parsedError, setParsedError] = useState<any>();
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'pie' | 'calendar'>('pie');
  const baseLink = useBaseLink();
  useEffect(() => {
    return (() => {
      setActiveFilter('all')
      setIsLoading(false);
      setListData([])
      setParsedError(null)
      setShowModal(false)
      setSelectedItem(null);
      setCurrentView('pie')
    })
  }, [])
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20
      );
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -50) {
        setCurrentView(prev => (prev === 'pie' ? 'calendar' : 'pie'));
      } else if (gestureState.dx > 50) {
        setCurrentView(prev => (prev === 'calendar' ? 'pie' : 'calendar'));
      }
    },
  });

  const fetchListData = useCallback(
    async (fromDateStr: string, toDateStr: string) => {
      try {
        setIsLoading(true);
        const raw = await dispatch(
          getERPListDataThunk({
            page: 'PunchIn',
            fromDate: fromDateStr,
            toDate: toDateStr,
            param: '',
          }),
        ).unwrap();
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const final = parsed?.d ? JSON.parse(parsed?.d) : parsed;
        setListData(final?.data || final || []);
        setTimeout(() => {
          setIsLoading(false);
        }, 1400)
      } catch (e: any) {
        setParsedError(e);
        setTimeout(() => {
          setIsLoading(false);
        }, 1400)
      } finally {

      }
    },
    [dispatch, theme],
  );

  useEffect(() => {
    if (fromDate && toDate) fetchListData(fromDate, toDate);
  }, [fromDate, toDate, fetchListData]);

  let data = listData?.length > 0 ? [...listData] : [];
  if (activeFilter !== 'all') {
    switch (activeFilter) {
      case 'leave':
        data = data.filter(i => i?.status?.toLowerCase() === 'leave');
        break;
      case 'leave_first_half':
        data = data.filter(i => i?.status?.toLowerCase() === 'leave_first_half');
        break;
      case 'leave_second_half':
        data = data.filter(i => i?.status?.toLowerCase() === 'leave_second_half');
        break;
      case 'late':
        data = data.filter(i => i?.intime && isLatePunchIn(i?.intime));
        break;
      case 'after_830':
        data = data.filter(i => i?.intime && isAfter830(i?.intime));
        break;
      case 'before_830':
        data = data.filter(i => i?.intime && isBefore830(i?.intime));
        break;
    }
  }
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
  const timelineData = Object.keys(groupedData).map(date => ({
    date,
    records: groupedData[date],
  }));

  const total = listData?.length;
  const leave = listData?.filter(i => i?.status?.toLowerCase() === 'leave').length;
  const late = listData?.filter(i => i?.intime && isLatePunchIn(i?.intime)).length;
  const lessHours = listData?.filter(
    i => i?.intime && i?.outtime && getWorkedHours(i?.intime, i?.outtime) < 8.5,
  ).length;
  const present = total - leave;

  const chartData = [
    { value: present, color: '#4caf50', text: t("text.text14") },
    { value: leave, color: ERP_COLOR_CODE.ERP_ERROR, text: t("text.text15") },
    { value: late, color: '#a6bfc9ff', text: t("text.text16") },
    { value: lessHours, color: '#ff9800', text: t("text.text17") },
  ];

  if (parsedError) {
    return (
      <View
        style={{
          height: Dimensions.get('screen').height * 0.75,
          alignContent: 'center',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ErrorMessage message={JSON.stringify(parsedError)} isShowTop ={false} />
      </View>
    );
  }

  const markedDates =
    listData?.length > 0 &&
    listData?.reduce((acc, item) => {
      const dateStr = item?.date && normalizeDate(item?.date);
      let color = ERP_COLOR_CODE.ERP_APP_COLOR;

      if (item?.status?.toLowerCase() === 'leave') {
        color = ERP_COLOR_CODE.ERP_ERROR;
      } else if (
        item?.status?.toLowerCase() === 'leave_first_half' ||
        item?.status?.toLowerCase() === 'leave_second_half'
      ) {
        color = '#ff9800';
      } else if (item?.status?.toLowerCase() === 'working') {
        color = ERP_COLOR_CODE.ERP_BORDER_LINE;
      }

      acc[dateStr] = {
        selected: true,
        selectedColor: color,
        customStyles: {
          container: { backgroundColor: color, borderRadius: 6 },
          text: { color: theme === 'dark' ? '#fff' : ERP_COLOR_CODE.ERP_WHITE, fontWeight: '600' },
        },
      };

      return acc;
    }, {});

  const openDetails = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeDetails = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <View
        style={{
          height: Dimensions.get('screen').height * 0.75,
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          alignSelf: 'center'
        }}
      >
        <FullViewLoader />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE }}>
      {showFilter && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          contentContainerStyle={{ alignItems: 'center', gap: 6 }}
        >
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter?.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[
                { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 4, borderWidth: 1 },
                activeFilter === filter.key
                  ? {
                    backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
                    borderColor: ERP_COLOR_CODE.ERP_WHITE,
                  }
                  : {
                    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
                    borderColor: ERP_COLOR_CODE.ERP_BORDER_LINE,
                  },
              ]}
            >
              <TranslatedText
                style={{
                  color:
                    activeFilter === filter.key ? theme === 'dark' ? '#fff' :
                      ERP_COLOR_CODE.ERP_WHITE
                      : ERP_COLOR_CODE.ERP_BLACK,
                  fontWeight: '600',
                }}
                numberOfLines={1}
                text={filter.label}
              >
                
              </TranslatedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {listData.length > 0 ?
        <FlatList
          data={['calendar']}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={() => (
            <>
              <View
                {...panResponder.panHandlers}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignContent: 'center',
                  alignItems: 'center',
                  backgroundColor: theme === 'dark' ? 'black' : 'white'
                }}
              >
                {currentView === 'pie' && listData?.length > 0 && (
                  <View
                    style={{
                      justifyContent: 'space-around',
                      padding: 16,
                      alignItems: 'center',
                      flexDirection: 'row',
                      borderRadius: 8,
                    }}
                  >
                    <PieChart
                      data={chartData}
                      donut
                      radius={90}
                      innerRadius={80}
                      textColor={theme === 'dark' ? '#fff' : "#000"}
                      showValuesAsLabels
                      innerCircleColor={theme === 'dark' ? '#000' : "#fff"}
                      centerLabelComponent={() => (
                        <Text style={{
                          color: theme === 'dark' ? '#fff' : "#000",
                          textAlign: 'center', fontSize: 18, fontWeight: '600'
                        }}>
                          {total + `\n`}{t("text.text18")}
                        </Text>
                      )}
                    />
                    <View style={{ marginTop: 12, gap: 12, marginHorizontal: 20 }}>
                      {chartData?.map((c, i) => (
                        <View
                          key={i}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: c.color,
                            }}
                          />
                          <TranslatedText
                          numberOfLines={1}
                          text={`${c?.text} (${c?.value})`}
                          style={{
                            color: theme === 'dark' ? '#fff' : "#000"
                          }}> 
                          </TranslatedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {currentView === 'calendar' && (
                  <View style={{ marginTop: 12 }}>
                    <Calendar
                      style={{
                        width: Dimensions.get('window').width - 20,
                        alignSelf: 'center',
                        borderRadius: 8,
                        elevation: 2,
                        backgroundColor: theme === 'dark' ? 'black' : 'white',
                        borderWidth: 1,
                        borderColor: theme === 'dark' ? 'white' : 'black',
                      }}
                      monthFormat={'MMMM yyyy'}
                      hideExtraDays={false}
                      firstDay={1}
                      onDayPress={day => {
                        const selectedData = listData?.find(
                          d => normalizeDate(d?.date) === day?.dateString,
                        );
                        openDetails(selectedData)
                      }}
                      markingType={'custom'}
                      markedDates={markedDates}
                      theme={{
                        textDayFontWeight: '600',
                        todayTextColor: theme === 'dark' ? '#fff' : ERP_COLOR_CODE.ERP_APP_COLOR,
                        arrowColor: theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_APP_COLOR,
                      }}
                    />
                  </View>
                )}
              </View>

              {!isLoading && (
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      marginVertical: 10,
                      gap: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentView('pie');
                      }}
                      style={{
                        width: currentView === 'pie' ? 24 : 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor:
                          currentView === 'pie'
                            ? ERP_COLOR_CODE.ERP_APP_COLOR
                            : ERP_COLOR_CODE.ERP_BORDER_LINE,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentView('calendar');
                      }}
                      style={{
                        width: currentView === 'calendar' ? 24 : 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor:
                          currentView === 'calendar'
                            ? ERP_COLOR_CODE.ERP_APP_COLOR
                            : ERP_COLOR_CODE.ERP_BORDER_LINE,
                      }}
                    />
                  </View>
                </View>
              )}

              {/* List */}
              {isLoading ? (
                <View
                  style={{
                    height: Dimensions.get('screen').height,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <FullViewLoader />
                </View>
              ) : data.length === 0 ? (
                <View
                  style={{
                    height: Dimensions.get('screen').height * 0.45,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <NoData isShowTop = {false}/>
                </View>
              ) : (
                <View style={{
                  marginHorizontal: 12,

                  backgroundColor: theme === 'dark' ? 'black' : 'white'
                }}>
                  <FlatList
                    data={timelineData}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <View style={{
                        marginBottom: 8,

                        backgroundColor: theme === 'dark' ? 'black' : 'white'

                      }}>
                        {/* <Text style={{ 
                        backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        // opacity: 0.5,
                        color: ERP_COLOR_CODE.ERP_WHITE,
                        fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                        {item.date}
                      </Text> */}

                        {/* Timeline Records */}
                        {item.records.map((rec, idx) => {
                          const isLeaveFull = rec?.status?.toLowerCase() === 'leave';
                          const workedHours =
                            !rec?.intime || !rec?.outtime
                              ? 0
                              : getWorkedHours(rec?.intime, rec?.outtime);
                          const isLessThanRequired = !isLeaveFull && workedHours < 8.5;
                          const isLate = !isLeaveFull && rec?.intime && isLatePunchIn(rec?.intime);

                          return (
                            <View key={rec.id} style={{ flexDirection: 'row', marginBottom: 0 }}>
                              {item.records.length > 1 && (
                                <View style={{ alignItems: 'center', width: 8 }}>
                                  <View
                                    style={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: 6,
                                      backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
                                    }}
                                  />
                                  <View
                                    style={{
                                      width: 2,
                                      flex: 1,
                                      backgroundColor: ERP_COLOR_CODE.ERP_BLACK,
                                    }}
                                  />
                                </View>
                              )}

                              <TouchableOpacity
                                onPress={() => openDetails(rec)}
                                style={{
                                  right: 10,
                                  flex: 1,
                                  marginTop: item.records.length > 1 ? 12 : 0,
                                }}
                              >
                                <View style={[styles.recordCard, theme === 'dark' && {
                                  borderColor: 'white',
                                  borderWidth: 1,
                                  backgroundColor: 'black'
                                }]}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                    {/* Images */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      {rec?.image && (
                                        <TouchableOpacity
                                          onPress={() => {
                                            setImg(`${baseLink}/${rec?.image}`)
                                            setShowImgModal(true)
                                          }}
                                        >
                                          <FastImage
                                            source={{
                                              uri: baseLink + '/' + rec?.image,
                                              priority: FastImage.priority.normal,
                                              cache: FastImage.cacheControl.web,
                                            }}
                                            style={styles.recordAvatar}
                                          />
                                        </TouchableOpacity>

                                      )}
                                      {rec?.image2 && (
                                        <TouchableOpacity
                                          onPress={() => {
                                            setImg(`${baseLink}/${rec?.image2}`)
                                            setShowImgModal(true)
                                          }}
                                        >
                                          <FastImage
                                            source={{
                                              uri: baseLink + '/' + rec?.image2,
                                              priority: FastImage.priority.normal,
                                              cache: FastImage.cacheControl.web,
                                            }}
                                            style={[
                                              styles.recordAvatar,
                                              {
                                                marginLeft: -28,
                                                borderWidth: 2,
                                                borderColor: ERP_COLOR_CODE.ERP_WHITE,
                                              },
                                            ]}
                                          />
                                        </TouchableOpacity>

                                      )}
                                    </View>

                                    {/* Details */}
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                      <View
                                        style={{
                                          flexDirection: 'row',
                                          justifyContent: 'space-between',
                                          marginBottom: 4,
                                        }}
                                      >
                                        <TranslatedText
                                        numberOfLines={1}
                                        text={rec?.employee}
                                        style={[styles.recordName, theme === 'dark' && {
                                          color: 'white'
                                        }]}></TranslatedText>
                                        <TranslatedText
                                        numberOfLines={1}
                                        text={rec?.date}
                                        style={[styles.recordDateTime, theme === 'dark' && {
                                          color: 'white'
                                        }]}></TranslatedText>
                                      </View>

                                      {
                                        <View
                                          style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                          }}
                                        >
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              gap: 4,
                                            }}
                                          >
                                            <MaterialIcons
                                              color={ERP_COLOR_CODE.ERP_666}
                                              size={14}
                                              name="access-alarm"
                                            />
                                            <TranslatedText 
                                            numberOfLines={1}
                                            text= {formatTo12Hour(rec?.intime) || '--'}
                                            style={[styles.recordPunchTime,]}>
                                             
                                            </TranslatedText>
                                          </View>

                                          {rec?.status?.toLowerCase() === 'working' ? (
                                            <View
                                              style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                              }}
                                            >
                                              <MaterialIcons
                                                color={ERP_COLOR_CODE.ERP_666}
                                                size={14}
                                                name="history-toggle-off"
                                              />
                                              <TranslatedText 
                                              numberOfLines={1}
                                              text=  {rec?.status}
                                              style={styles.recordPunchTime}>
                                              
                                              </TranslatedText>
                                            </View>
                                          ) : (
                                            <>
                                              {rec?.outtime && rec?.status?.toLowerCase() !== 'working' && rec?.status?.toLowerCase() !== 'leave' && (
                                                <View
                                                  style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                  }}
                                                >
                                                  {/* <MaterialIcons
                                                    color={ERP_COLOR_CODE.ERP_666}
                                                    size={14}
                                                    name="timeline"
                                                  /> */}
                                                  <Text
                                                    style={[
                                                      styles.recordPunchTime,
                                                      {
                                                        color:
                                                          getWorkedHours(
                                                            rec?.intime,
                                                            rec?.outtime,
                                                          ) < 9.5
                                                            ? ERP_COLOR_CODE.ERP_ERROR
                                                            : ERP_COLOR_CODE.ERP_666,
                                                      },
                                                    ]}
                                                  >
                                                    -
                                                    {/* {getWorkedHours2(rec?.intime, rec?.outtime)} */}
                                                  </Text>
                                                </View>
                                              )}
                                            </>
                                          )}

                                          {rec?.status?.toLowerCase() !== 'working' && (
                                            <View
                                              style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                              }}
                                            >
                                              <MaterialIcons
                                                color={ERP_COLOR_CODE.ERP_666}
                                                size={14}
                                                name="access-alarm"
                                              />
                                              <TranslatedText 
                                              numberOfLines={1}
                                              text= {formatTo12Hour(rec?.outtime) || '--'}
                                              style={styles.recordPunchTime}>
                                               
                                              </TranslatedText>
                                            </View>
                                          )}
                                        </View>
                                      }

                                      {isLeaveFull && (
                                        <Text style={styles.statusBadgeRed}>{t("text.text10")}</Text>
                                      )}
                                      {isLate && <Text style={styles.statusBadgeBlue}>{t("text.text16")}</Text>}
                                      {rec?.outTime &&
                                        rec?.status?.toLowerCase() !== 'working' &&
                                        isLessThanRequired && (
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              justifyContent: 'space-between',
                                            }}
                                          >
                                            <Text style={styles.statusBadgeGrey}>{t("text.text21")}</Text>
                                            <Text style={styles.statusBadgeGrey}>
                                              {/* ({workedHours.toFixed(2)} hrs) */}
                                              -
                                            </Text>
                                          </View>
                                        )}

                                      {/* <View
                                        style={{
                                          alignContent: 'center',
                                          alignItems: 'center',
                                          flexDirection: 'row',
                                          gap: 4,
                                          marginTop: 4,
                                        }}
                                      >
                                        <MaterialIcons
                                          size={16}
                                          color={ERP_COLOR_CODE.ERP_ERROR}
                                          name="location-on"
                                        />
                                        <Text>{rec?.location || 'Dummy location'} </Text>
                                      </View> */}
                                    </View>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  />
                </View>
              )}
            </>
          )}
        /> :
        <>
          <View style={{
            height: Dimensions.get('screen').height * 0.75,
            flex: 1, justifyContent: 'center', alignContent: 'center', alignItems: 'center'
          }}>
            <NoData isShowTop = {false}/>
          </View>
        </>
      }

      <ImageBottomSheetModal
        visible={showImgModal}
        onClose={() => setShowImgModal(false)}
        imageUrl={img}
      />
      <DetailsBottomSheet
        visible={showModal}
        onClose={closeDetails}
        item={selectedItem}
        baseLink={baseLink}
      />
    </View>
  );
};

export default List;

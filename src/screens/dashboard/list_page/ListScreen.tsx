import { Text, View, TextInput, TouchableOpacity, Alert, Modal, Platform, Animated, ActivityIndicator } from 'react-native';
import React, { useEffect, useLayoutEffect, useState, useCallback, useMemo, useRef } from 'react';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { getERPListDataThunk } from '../../../store/slices/auth/thunk';
import { styles } from './list_page_style';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateForAPI, parseCustomDate } from '../../../utils/helpers';
import FullViewLoader from '../../../components/loader/FullViewLoader';
import { ListRouteParams } from './types';
import ErrorMessage from '../../../components/error/Error';
import TableView from './components/TableView';
import ReadableView from './components/ReadableView';
import ERPIcon from '../../../components/icon/ERPIcon';
import CustomAlert from '../../../components/alert/CustomAlert';
import { handleDeleteActionThunk, handlePageActionThunk } from '../../../store/slices/page/thunk';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { ERP_COLOR_CODE } from '../../../utils/constants';
import useTranslations from '../../../hooks/useTranslations';
import { tags } from 'react-native-svg/lib/typescript/xmlTags';
import { JumpingTransition } from 'react-native-reanimated';
import TranslatedText from '../tabs/home/TranslatedText';

const ListScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {
    loading: actionLoader,
    error: actionError,
    response: actionResponse,
  } = useAppSelector(state => state.page);
  const { t } = useTranslations();
  const [loadingListId, setLoadingListId] = useState<string | null>(null);
  const [listData, setListData] = useState<any[]>([]);
  const [configData, setConfigData] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [isTableView, setIsTableView] = useState<boolean>(false);

  const [filteredData, setFilteredData] = useState<any[]>([]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [actionLoaders, setActionLoader] = useState(false);
  const [parsedError, setParsedError] = useState<any>();
  const [apiError, setApiError] = useState<any>(false);
  const [tapLoader, setTapLoader] = useState(false)

  useEffect(() => {
    return (() => {
      setTapLoader(false)
    })
  }, [])

  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info',
    actionValue: '',
    color: ERP_COLOR_CODE.ERP_BLACK,
    id: 0,
  });

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<null | {
    type: 'from' | 'to';
    show: boolean;
  }>(null);

  const route = useRoute<RouteProp<ListRouteParams, 'List'>>();
  const { item } = route?.params;
  console.log("-----------------------------------")
  const theme = useAppSelector(state => state?.theme.mode);

  const pageTitle = item?.title || item?.name || 'List Data';
  const pageParamsName = item?.name || 'List Data';
  const pageName = item?.url;
  const isFromBusinessCard = item?.isFromBusinessCard || false;
  const isFromAlertCard = item?.isFromAlertCard || false;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.86,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 4,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };
  // useEffect(() => {
  //   if (!filteredData) return;
  //   setPage(1);
  //   setHasMore(true);

  //   const firstPage = filteredData.slice(0, pageSize);
  //   setListData(firstPage);
  // }, [filteredData]);

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    setTimeout(() => {
      const start = page * pageSize;
      const end = start + pageSize;

      const newItems = filteredData.slice(start, end);

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setListData(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
      }

      setIsLoadingMore(false);
    }, 300);
  };

  const totalAmount = filteredData?.reduce((sum, item) => {
    const amount = parseFloat(item?.amount) || 0;
    return sum + amount;
  }, 0);

  const totalQty = filteredData?.reduce((sum, item) => {
    const amount = parseFloat(item?.qty) || 0;
    return sum + amount;
  }, 0);

  const hasDateField = configData.some(
    item => item?.datafield && item?.datafield.toLowerCase() === 'date',
  );

  const hasIdField = configData.some(
    item => item?.datafield && item?.datafield.toLowerCase() === 'id',
  );

    useFocusEffect(
    useCallback(() => {
       setTapLoader(false)
      return () => {
      };
    }, [navigation])
  );
 

  useLayoutEffect(() => {
     
    
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
        // borderBottomWidth: 1,
        borderBottomColor: '#fff',
      },
      headerBackTitle: '',
      headerTintColor: '#fff',
      headerTitle: () => (
        <TranslatedText
          numberOfLines={1}
          style={{
            maxWidth: 180,
            fontSize: 18,
            fontWeight: '700',
            color: theme === 'dark' ? "white" : ERP_COLOR_CODE.ERP_WHITE,
          }}
          text= {pageTitle || 'List Data'}
        >
         
        </TranslatedText>
      ),
      headerRight: () => (
        <>
          {
            !error && <ERPIcon
              name="refresh"
              onPress={() => {
                setActionLoader(true);
                onRefresh();
              }}
              isLoading={actionLoaders}
            />
          }
          {/* {
            !isFromAlertCard && <ERPIcon
              name={isTableView ? 'list' : 'apps'}
              onPress={() => {
                setIsTableView(!isTableView);
              }}
            />
          } */}
          {
            !error && <ERPIcon
              name={!hasDateField ? 'search' : isFilterVisible ? 'close' : 'filter-alt'}
              onPress={() => {
                setIsFilterVisible(!isFilterVisible);
              }}
            />
          }
        </>
      ),
    });
  }, [navigation, pageTitle, isFilterVisible, hasDateField, isTableView, actionLoaders, error]);

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

  const debouncedSearch = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;

      return (query: string, data: any[]) => {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
          const trimmedQuery = query.trim();

          if (trimmedQuery === '') {
            setFilteredData(data);
            return;
          }

          const keySearchMatch = trimmedQuery?.match(/^(\w+):(.+)$/);
          let filtered;

          if (keySearchMatch) {
            const [, key, value] = keySearchMatch;
            const lowerValue = value.trim().toLowerCase();

            filtered = data?.filter(item => {
              const fieldValue = item[key];
              if (!fieldValue) return false;

              const stringValue =
                typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue);

              return stringValue.toLowerCase().includes(lowerValue);
            });
          } else {
            filtered = data?.filter(item => {
              const allValues = Object.values(item)
                .map(val => {
                  if (typeof val === 'object' && val !== null) return JSON.stringify(val);
                  if (val === null || val === undefined) return '';
                  return String(val);
                })
                .join(' ')
                .toLowerCase();
              return allValues?.includes(trimmedQuery?.toLowerCase());
            });
          }
          setFilteredData(filtered);
        }, 300);
      };
    }, []),
    [],
  );

  const onRefresh = async () => {
    try {
      setSearchQuery('');
      getCurrentMonthRange();
      await fetchListData(fromDate, toDate);
    } catch (e) {
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text, listData);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredData(listData);
  };

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
          Alert.alert('Invalid Date Range', 'To date cannot be before From date.', [
            { text: 'OK' },
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

  const fetchListData = useCallback(
    async (fromDateStr: string, toDateStr: string) => {
      // if (isFilterVisible) {
      //   return;
      // }
      try {
        setError(null);
        setLoadingListId(item?.id || 0);

        const raw = await dispatch(
          getERPListDataThunk({
            page: item?.url,
            fromDate: fromDateStr,
            toDate: toDateStr,
            param: '',
          }),
        ).unwrap();
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        let dataArray = [];
        let configArray = [];

        if (Array.isArray(parsed)) {
          dataArray = parsed;
          configArray = [];
        } else if (Array.isArray(parsed?.data)) {
          dataArray = parsed.data;
          configArray = parsed.config || [];
        } else if (Array.isArray(parsed?.list)) {
          dataArray = parsed.list;
          configArray = parsed.config || [];
        } else if (parsed && typeof parsed === 'object') {
          const keys = Object.keys(parsed).filter(key => !isNaN(Number(key)));
          if (keys.length > 0) {
            dataArray = keys.map(key => parsed[key]);
            configArray = parsed.config || [];
          }
        }

        setConfigData(configArray);
        setListData(dataArray);
        setFilteredData(dataArray);
      } catch (e: any) {
        setError(e || 'Failed to load list data');
        setParsedError(e);
      } finally {
        setLoadingListId(null);
        setTimeout(() => {
          setActionLoader(false);
        }, 10);
      }
    },
    [item, dispatch],
  );

  useEffect(() => {
    const { fromDate: initialFromDate, toDate: initialToDate } = getCurrentMonthRange();
    fetchListData(initialFromDate, initialToDate);
  }, [getCurrentMonthRange, fetchListData]);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchListData(fromDate, toDate);
    }
  }, [fromDate, toDate]);

  useFocusEffect(
    useCallback(() => {
      const { fromDate: initialFromDate, toDate: initialToDate } = getCurrentMonthRange();
      fetchListData(initialFromDate, initialToDate);
      return () => { };
    }, [getCurrentMonthRange, fetchListData]),
  );

  const handleItemPressed = (item, page, pageTitle = '') => {
    setIsFilterVisible(false);
    setSearchQuery('');
    navigation.navigate('Page', {
      item,
      title: page,
      isFromNew: true,
      url: pageName,
      pageTitle: pageTitle,
      isFromBusinessCard: isFromBusinessCard,
      isFromProfile : false
    });
  };

  const handleActionButtonPressed = (actionValue, label, color, id, item) => {
    if (item?.btn_edit && item?.btn_edit?.includes("/")) {
      const left = item?.btn_edit.substring(0, item?.btn_edit.indexOf('/'));
      const result = item?.btn_edit.split('/')[1];
      navigation.navigate('Page', {
        item,
        id: result,
        title: pageName,
        isFromNew: false,
        url: left,
        pageTitle: pageTitle,
        isFromBusinessCard: false,
        isFromProfile: false
      });
    } else {
      setAlertConfig({
        title: label,
        message: `${t("msg.msg8")} ${label.toLowerCase()} ?`,
        type: 'info',
        actionValue: actionValue,
        color: color,
        id: id,
      });
      setAlertVisible(true);
    }
  };

  const handleDeleteNotification = async (item: any) => {
    await dispatch(
      handleDeleteActionThunk({
        id: item.id.toString(),
        remarks: "",
        page: "DEVNOTIFY",
      }),
    ).unwrap();
    setAlertVisible(false);
    onRefresh();
  }

  if (parsedError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme == 'dark' ? 'black' :  ERP_COLOR_CODE.ERP_WHITE }}>
        <ErrorMessage message={parsedError} isShowTop ={false} />
      </View>
    );
  }

  if(loadingListId){
    return <FullViewLoader isShowTop={theme === 'dark' ? false : true}/>
  }

  return (
    <View style={[styles.container, theme === 'dark' && { backgroundColor: 'black' }]}>
       
           
      {isFilterVisible && (
        <View style={{
          backgroundColor: theme === 'dark' ?  '#000': ERP_COLOR_CODE.ERP_APP_COLOR,
          borderWidth: 1,
          padding: 8,
          paddingBottom: 8,
          borderBottomEndRadius: 12,
          borderBottomStartRadius: 12
        }}>
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer,
            theme === 'dark' && {
              backgroundColor: 'black'
            }
            ]}>
              <MaterialIcons size={24} name="search" color={theme === 'dark' ? 'white' : 'black'} />
              <TextInput
                style={[styles.searchInput,
                theme === 'dark' && {
                  color: 'white'
                }
                ]}
                placeholder={`Search ${pageTitle.toLowerCase()} in list...`}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholderTextColor={ERP_COLOR_CODE.ERP_6C757D}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {hasDateField && (
            <View style={styles.dateContainer}>
              {/* Start Date */}
              <View style={styles.dateRow}>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setShowDatePicker({ type: 'from', show: true })
                  }}
                  style={styles.dateButton}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons
                      name="calendar-today"
                      size={18}
                      color="#000"
                      style={{ marginRight: 8 }}
                    />
                    <TranslatedText 
                    numberOfLines={1}
                    text={fromDate || t("msg.msg9")}
                    style={styles.dateButtonText}></TranslatedText>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{ height: 1, width: 8 }}> </View>

              {/* End Date */}
              <View style={styles.dateRow}>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setShowDatePicker({ type: 'to', show: true })
                  }}
                  style={styles.dateButton}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons
                      name="calendar-today"
                      size={18}
                      color="#000"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.dateButtonText}>{toDate || t("msg.msg11")}</Text>
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
                    is24Hour={false}
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
        </View>
      )}

      {!!error ? (
       <View style={{flex: 1, backgroundColor:theme === 'dark' ? 'black' : 'white'}}>
         <ErrorMessage message={error} isShowTop ={false} />
        </View>
      ) : (
        <>
          {loadingListId ? (
            <FullViewLoader />
          ) : (
            <>
              {isTableView ? (
                <>
                  <TableView
                    configData={configData}
                    filteredData={filteredData}
                    loadingListId={loadingListId}
                    totalAmount={totalAmount}
                    totalQty={totalQty}
                    pageParamsName={pageParamsName}
                    handleItemPressed={handleItemPressed}
                    pageName={pageName}
                    setIsFilterVisible={setIsFilterVisible}
                    setSearchQuery={setSearchQuery}
                    isFromBusinessCard={isFromBusinessCard}
                    handleActionButtonPressed={handleActionButtonPressed}
                  />
                </>
              ) : (
                <>
                  <ReadableView
                    handleDeleteNotification={handleDeleteNotification}
                    isFromAlertCard={isFromAlertCard}
                    configData={configData}
                    filteredData={filteredData}
                    loadingListId={loadingListId}
                    totalAmount={totalAmount}
                    totalQty={totalQty}
                    isFromBusinessCard={isFromBusinessCard}
                    pageParamsName={pageParamsName}
                    handleItemPressed={handleItemPressed}
                    pageName={pageName}
                    setIsFilterVisible={setIsFilterVisible}
                    setSearchQuery={setSearchQuery}
                    handleActionButtonPressed={handleActionButtonPressed}
                    isLoadingMore={isLoadingMore}
                    loadMore={loadMore}
                  />
                </>
              )}
            </>
          )}
        </>
      )}

      {/* {hasIdField && !isFromAlertCard && !loadingListId && configData && (
        <Animated.View
          style={{
            transform: [
              { scale: pressAnim },
            ],
          }}
        >
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                bottom: filteredData.length === 0 ? 40 : totalAmount === 0 ? 64 : 78,
              },
              theme === 'dark' && {
                backgroundColor: 'white',
                borderWidth: 1,
                borderColor: 'white'
              }
            ]}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => {
              setTapLoader(true)
              handleItemPressed({}, pageParamsName, pageTitle);
            }}
          >
            {
              tapLoader ? <ActivityIndicator size={'large'} color={'#fff'} /> : 
              <MaterialIcons size={32} name="add" color={theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE} />
            }
          </TouchableOpacity>
        </Animated.View>

      )} */}

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
        onCancel={() => setAlertVisible(false)}
        actionLoader={actionLoader}
        isBottomButtonVisible={true}
        doneText={alertConfig.title}
        color={alertConfig.color}
        onDone={async (remark) => {
          try {
            const type = `page${alertConfig.title}`;
            await dispatch(
              handlePageActionThunk({
                action: type,
                id: alertConfig.id.toString(),
                remarks: remark,
                page: alertConfig?.actionValue,
              })
            ).unwrap();

            setAlertVisible(false);
            onRefresh();
          } catch (err) {
            setAlertVisible(false);
            setAlertConfig({
              title: 'Api error',
              message: err?.toString() || '',
              type: 'info',
              actionValue: '',
              color: '',
              id: 0,
            });
            setApiError(true);
          }
        } }
        isFromButtonList={true} closeHide={undefined}      
      />

      <CustomAlert
        visible={apiError}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setApiError(false)}
        onCancel={() => setApiError(false)}
        actionLoader={actionLoader}
        closeHide={undefined}      
      />
    </View>
  );
};

export default ListScreen;
import React, { useCallback, useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, Modal, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { styles } from '../page_style';
import { DARK_COLOR, ERP_COLOR_CODE } from '../../../../utils/constants';
import { getAjaxThunk } from '../../../../store/slices/ajax/thunk';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import FullViewLoader from '../../../../components/loader/FullViewLoader';
import useTranslations from '../../../../hooks/useTranslations';
import InputError from '../../../../components/error/InputError';
import NoData from '../../../../components/no_data/NoData';
import TranslatedText from '../../tabs/home/TranslatedText';

const AjaxPicker = ({ isValidate, label, onValueChange, item, errors, dtext, formValues }: any) => {
  const dispatch = useAppDispatch();

  const [selectedOption, setSelectedOption] = useState(dtext || item?.text || item?.value);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState('');
  const theme = useAppSelector(state => state?.theme.mode);
  const { t } = useTranslations();
  const { user } = useAppSelector((state) => state?.auth);
    console.log("user------user-------user------------", user)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        fetchOptions();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSelectedOption(item?.dtext || item?.text || item?.value);
  }, [dtext, item]);

  const fetchOptions = useCallback(async () => {

   console.log("item-------------------------", item);

let resolvedWhere = item?.ddlwhere;

// 1️⃣ Replace {key} format
resolvedWhere = resolvedWhere?.replace(/\{(\w+)\}/g, (_, key) => {
  const lowerKey = key.toLowerCase();
  return formValues.hasOwnProperty(lowerKey)
    ? formValues[lowerKey]
    : `{${key}}`;
});

// 2️⃣ Replace $UID with item.id
resolvedWhere = resolvedWhere?.replace(/\$UID/g, user?.id);

console.log("resolvedWhere-------------------------", resolvedWhere);

 
    try {
      setLoader(true);
      const res = await dispatch(
        getAjaxThunk({
          dtlid: item?.dtlid,
          where: resolvedWhere,
          search: search,
        }),
      ).unwrap();
      setOptions(res?.data ?? []);
      setLoader(false);
    } catch (e) {
      setOptions([]);
      setLoader(false);
    }
  }, [dispatch, item?.dtlid, item?.ddlwhere, search, formValues]);

  const handleOpen = async () => {
    setOpen(true);
    await fetchOptions();
  };

  const handleSelect = (opt: any) => {
    console.log("item----", item)
    const afterDash = item?.ddl?.split('-')[1];
    const arr = afterDash?.split(',');

    const result = arr?.reduce((acc, key) => {
      const lowerKey = key?.toLowerCase();
      acc[lowerKey] = String(opt[lowerKey] ?? '');
      return acc;
    }, {});

    onValueChange({
      [item?.dfield]:
        opt[`${item?.ddlfield.toLowerCase()}id`] ?? opt[`${item?.field}id`] ?? opt[item?.field],

      [item?.dfield || item?.ddlfield.toLowerCase()]:
        opt[item?.ddlfield.toLowerCase()] ?? opt[item?.dfield],

      ...result,
    });

    setSelectedOption(opt[item?.ddlfield.toLowerCase()] ?? opt[item?.dfield]);
    setOpen(false);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row' }}>
        <TranslatedText 
        numberOfLines={1}
        style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}
        text={label}
        ></TranslatedText>
        {item?.tooltip !== label && <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}> - ( {item?.tooltip} ) </Text>}
        {item?.mandatory === '1' && <Text style={{ color: ERP_COLOR_CODE.ERP_ERROR }}>*</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.pickerBox,
          item?.disabled === '1' && styles.disabledBox,
          errors[item?.field] && {
            borderColor: ERP_COLOR_CODE.ERP_ERROR,
          },
          isValidate && item?.mandatory === '1' && selectedOption && {
            borderColor: 'green',
            borderWidth: 0.8
          }, 
          theme === 'dark' && {
            backgroundColor: 'black',
            borderWidth: 1,
          },
           item?.background && {
              
            backgroundColor: item?.background
            },
            item?.disabled == '1' &&  theme === 'dark' && {
            backgroundColor: DARK_COLOR,
          }
        ]}
        onPress={() => {
          if (item?.disabled !== '1') {
            handleOpen();
          }
        }}
        activeOpacity={0.7}
      >
        <TranslatedText 
        numberOfLines={1}
        text={selectedOption || `${t("text.text34")} ${label}`}

        style={{ color: theme === 'dark' ? 'white' : selectedOption ? ERP_COLOR_CODE.ERP_BLACK : ERP_COLOR_CODE.ERP_888, flex: 1 }}>
          
        </TranslatedText>
        <MaterialIcons name={'arrow-drop-down'} size={24} color={ERP_COLOR_CODE.ERP_555} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <View
            style={[
              {
                height: '75%',
                backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_WHITE,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 16,
              },
              theme === 'dark' && {
                borderWidth: 1,
                borderColor: 'white'
              }
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TranslatedText 
              numberOfLines={1}
              text={label}
              style={{ fontSize: 16, fontWeight: '600', color: theme === 'dark' ? 'white' : "#000" }}></TranslatedText>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <MaterialIcons name="close" size={24} color={theme === 'dark' ? 'white' : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={{ position: 'relative', marginVertical: 12 }}>
              <TextInput
                style={[styles.textInput,
                theme === 'dark' && {
                  color: 'white',
                  backgroundColor: 'black',
                  borderWidth: 1,
                  borderColor: 'white'
                },
                { paddingRight: 40 }]}
                placeholder={t("title.title5")}
                placeholderTextColor={ERP_COLOR_CODE.ERP_888}
                value={search}
                onChangeText={setSearch}
              />

              {search?.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: [{ translateY: -12 }],
                  }}
                >
                  <MaterialIcons name="close" size={20} color={ERP_COLOR_CODE.ERP_888} />
                </TouchableOpacity>
              )}
            </View>

            {loader ? (
              <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
                <FullViewLoader isShowTop={false}/>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {options?.length > 0 ? (
                  options?.map((opt: any, i: number) => {
                    const entries = Object.entries(opt).filter(
                      ([key]) => !key.toLowerCase().includes('id'),
                    );

                    const isGrid = entries.length >= 3;

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.option, { paddingVertical: 12 },
                          theme === 'dark' && {
                             borderBottomColor : ERP_COLOR_CODE.ERP_F8F9FA
                          }
                        ]}
                        onPress={() => handleSelect(opt)}
                      >
                        <View
                          style={{
                            flexDirection: isGrid ? 'row' : 'column',
                            flexWrap: isGrid ? 'wrap' : 'nowrap',
                          }}
                        >
                          {entries?.map(([key, value], idx) => (
                            <View
                              key={idx}
                              style={{
                                width: isGrid ? '33.33%' : '100%',
                                paddingVertical: 4,
                                paddingHorizontal: 6,
                              }}
                            >
                              <TranslatedText
                                style={[{
                                  color:
                                    key === label?.toLowerCase()
                                      ? ERP_COLOR_CODE.ERP_APP_COLOR
                                      : ERP_COLOR_CODE.ERP_BLACK,
                                  fontSize: key === label?.toLowerCase() ? 16 : 14,
                                  fontWeight: key === label?.toLowerCase() ? '700' : '400',
                                }, {
                                  color: theme === 'dark' ? 'white' : "#000"
                                }]}
                                numberOfLines={1}
                                text= {String(value)}
                              >
                               
                              </TranslatedText>
                            </View>
                          ))}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View
                  style={{
                    marginVertical: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 100,
                    alignContent:'center',
                    marginTop: 200,
                  }}
                >
                  <NoData isShowTop = {false}/>
                </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {errors[item.field] && (
        <InputError error = {errors[item?.field]}/>
      )}

    </View>
  );
};

export default React.memo(AjaxPicker);

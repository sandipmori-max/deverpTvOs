import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { styles } from '../page_style';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import { useCurrentAddress } from '../../../../hooks/useCurrentLocation';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import useTranslations from '../../../../hooks/useTranslations';
import ShortAction from './ShortAction';
import { useAppSelector } from '../../../../store/hooks';

const LocationRow = ({ locationEnabled, locationVisible, isValidate, item, value, setValue }: any) => {
  const { coords, address: hookAddress, loading, error, refetch } = useCurrentAddress();
  const [address, setAddress] = useState<string>('');
    const { t } = useTranslations();
  const theme = useAppSelector(state => state?.theme.mode);
  console.log("locationEnabled", locationEnabled)

  useEffect(() => {
    if(error){
      setValue({
        [item?.field]: ``,
      });
      setAddress('')
      return;
    }
    if(!locationEnabled){
      console.log("locationEnabled", locationEnabled)
      setValue({
        [item?.field]: ``,
      });
      setAddress('')
      return;
    }

    if (item?.text !== '' && item?.text !== '#location') {
      setAddress(item?.text);
      return;
    }

    if (!loading && hookAddress) {
      setValue({
        [item?.field]: hookAddress,
      });
      setAddress(hookAddress || `${coords?.latitude},${coords?.longitude}`);
    }
  }, [coords, loading, locationVisible, hookAddress, locationEnabled, error]);

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent:'space-between' }}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}>{item?.fieldtitle}</Text>
        {item?.fieldtitle !== item?.tooltip && <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}> - ( {item?.tooltip} )</Text>}
        {item?.mandatory === '1' && <Text style={{ color: ERP_COLOR_CODE.ERP_ERROR }}>*</Text>}
        </View>
        {
          !error &&  <ShortAction item={item} value={address}/>
        }
      </View>

      {/* Address / Loading / Error */}
      <View style={[styles.disabledBox, theme === 'dark' && {
        backgroundColor: ERP_COLOR_CODE.ERP_555 
      }]}>
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme === 'dark' ? 'white':ERP_COLOR_CODE.ERP_555} />
            <Text style={{ marginLeft: 8, color: theme === 'dark' ?'white' :ERP_COLOR_CODE.ERP_555 }}>
              {t('text.text37')}
            </Text>
          </View>
        ) : address ? (
          <Text style={{ marginTop: 4, color: theme === 'dark' ?'white' : ERP_COLOR_CODE.ERP_333 }}>{address} </Text>
        ) : (
          <View
            style={{
              alignContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{  color: theme === 'dark' ?'white' : '#999', width: '80%' }}>
              {error ? `${t("title.title1")}: ${error}` : t("text.text38")}
            </Text>
            {
               <TouchableOpacity
              style={{
                paddingVertical: 4,
                paddingHorizontal: 6,
                backgroundColor: theme === 'dark' ?'white' : ERP_COLOR_CODE.ERP_APP_COLOR,
                borderRadius: 6,
                alignSelf: 'flex-start',
              }}
              onPress={refetch}
            >
              <MaterialIcons name={"refresh"} color={theme === 'dark' ?'black' : '#fff'} size={18} />
            </TouchableOpacity>
            }
           
          </View>
        )}
      </View>
    </View>
  );
};

export default LocationRow;

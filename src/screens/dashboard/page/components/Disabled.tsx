import { View, Text, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { styles } from '../page_style';
import { DARK_COLOR, ERP_COLOR_CODE } from '../../../../utils/constants';
import { formatDateHr, handleEmailPress, handlePhonePress } from '../../../../utils/helpers';
import { useAppSelector } from '../../../../store/hooks';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import ShortAction from './ShortAction';

const Disabled = ({ item, value, type }: any) => {
  const theme = useAppSelector(state => state?.theme.mode);

  const getDisplayValue = () => {
    if (type === 'DATETIME') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return formatDateHr(date, true);
      } else {
        return value || '-';
      }
    }
    return value || '-';
  };

  

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ 
        flexDirection: 'row',  
        justifyContent:'space-between'
         }}>
        <View  style={{ 
        flexDirection: 'row',  
        
         }}>
          <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}>{item?.fieldtitle}</Text>
        {item?.fieldtitle !== item?.tooltip && <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}> - ( {item?.tooltip} )</Text>}
        {item?.mandatory === '1' && <Text style={{ color: ERP_COLOR_CODE.ERP_ERROR }}>*</Text>}
        </View>
        <ShortAction item={item} value={value}/>
      </View>
      <View style={[styles.disabledBox, theme === 'dark' && {
        backgroundColor: DARK_COLOR
      }]}>
        <Text style={{ color: theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_555 }}>
          {getDisplayValue()}
        </Text>
      </View>
    </View>
  );
};

export default Disabled;

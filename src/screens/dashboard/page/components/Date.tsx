import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { styles } from '../page_style';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { formatDateHr } from '../../../../utils/helpers';
import { useAppSelector } from '../../../../store/hooks';
import InputError from '../../../../components/error/InputError';

const DateRow = ({ isValidate, item, errors, value, showDatePicker }: any) => {
  const theme = useAppSelector(state => state?.theme.mode);

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}>{item?.fieldtitle}</Text>
        {item?.fieldtitle !== item?.tooltip && <Text style={[styles.label, theme === 'dark' && {
          color: 'white'
        }]}> - ( {item?.tooltip} )</Text>}
        {item?.mandatory === '1' && <Text style={{ color: ERP_COLOR_CODE.ERP_ERROR }}>*</Text>}
      </View>
      <TouchableOpacity
        style={[
          styles.dateBox,
          errors[item.field] && { borderColor:   ERP_COLOR_CODE.ERP_ERROR },
          isValidate &&
          item?.mandatory === '1' &&
          value && {
            borderColor: 'green',
            borderWidth: 0.8,
          },
          item?.borderColor && {
            borderColor: item?.borderColor
          },
           theme === 'dark' && {
            backgroundColor: 'black'
           }
        ]}
        onPress={() => showDatePicker(item?.field, value)}
      >
        <Text style={{ color: theme === 'dark' ? 'white' : value ? ERP_COLOR_CODE.ERP_BLACK : ERP_COLOR_CODE.ERP_888 }}>
          {value ? formatDateHr(value, false) : 'dd/mmm/yyyy'}
        </Text>
        <MaterialIcons name="event" size={20} color={ERP_COLOR_CODE.ERP_555} />
      </TouchableOpacity>
      {
        !value && errors[item.field] && (
                  <InputError error = {errors[item?.field]}/>
        )}
    </View>
  );
};

export default DateRow;

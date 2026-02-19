import { View, Text, TextInput } from 'react-native';
import React, { useState } from 'react';
import { styles } from '../page_style';
import { DARK_COLOR, ERP_COLOR_CODE } from '../../../../utils/constants';
import { useAppSelector } from '../../../../store/hooks';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import ShortAction from './ShortAction';
import InputError from '../../../../components/error/InputError';

const Input = ({ id, isValidate, item, errors, value, setValue, onFocus }: any) => {

  const theme = useAppSelector(state => state?.theme.mode);

  React.useEffect(() => {
    setValue(value);
  }, [value]);
  const [isInputEdit, setIsInputEdit] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row' , justifyContent:'space-between'}}>
        <View style={{ flexDirection: 'row' }}>
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
      <TextInput
        id={id}
        multiline={item?.size > 100 ? true : value?.length > 40 ? true : item?.title === 'Card Text' ? true : false}
        editable
        scrollEnabled
        style={[
          styles.textInput,
          item?.size > 100 && { minHeight: 100, textAlignVertical: 'top' },
          errors[item.field] && { borderColor: ERP_COLOR_CODE.ERP_ERROR },
          value && {
            borderColor: 'green',
            borderWidth: 0.8,
          },
          isInputEdit && {
            borderColor: '#81b5e4',
            borderWidth: 0.8,
          },
          isValidate &&
          item?.mandatory === '1' &&
          value && {
            borderColor: 'green',
            borderWidth: 0.8,
          },
          theme === 'dark' && {
            backgroundColor: 'black'
          },
          theme === 'dark' && value && {
            color: 'white'
          },
          item?.borderColor && {
            borderColor: item?.borderColor
          }
        ]}
        keyboardType={item?.ctltype === 'NUMERIC' ? 'number-pad' : 'default'}
        value={value.toString()}
        onChangeText={text => setValue(text)}
        placeholder={`Enter ${item?.fieldtitle}`}
        onFocus={e => {
          setIsInputEdit(true);
          onFocus(e);
        }}
        onBlur={() => {
          if (!value) {
            setIsInputEdit(false);
          }
        }}
        placeholderTextColor={theme === 'dark' ? 'white' : 'gray'}
      />
      {errors[item.field] && (
               <InputError error = {errors[item?.field]}/>
      )}
    </View>
  );
};

export default Input;

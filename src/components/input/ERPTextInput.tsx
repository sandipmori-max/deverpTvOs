import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { ERPTextInputProps } from './type';
import { styles } from './input_style';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { ERP_COLOR_CODE } from '../../utils/constants';
import { Easing } from 'react-native';
import TranslatedText from '../../screens/dashboard/tabs/home/TranslatedText';

const ERPTextInput: React.FC<ERPTextInputProps> = ({
  label,
  error,
  touched,
  helperText,
  secureTextEntry,
  showToggle = false,
  icon,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  helperStyle,
  field,
  isInputEdit,
  value,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
 const errorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (touched && error) {
      errorAnim.setValue(0);
      Animated.timing(errorAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [touched, error]);
  return (
    <View style={[styles.inputContainer, containerStyle, ,]}>
      {label ? <TranslatedText 
      text={label}
      numberOfLines={1}
      style={[styles.inputLabel, labelStyle]}></TranslatedText> : null}

      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputContainer,
            {
              alignContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: ERP_COLOR_CODE.ERP_BORDER_LINE,
              paddingLeft: 12,
            },
            touched && !!error && {
              borderColor: ERP_COLOR_CODE.ERP_ERROR,
              borderWidth: 0.8,
            },
            isInputEdit && {
              borderColor: '#81b5e4',
              borderWidth: 0.8,
            },
            value && {
              borderColor: 'green',
            }
          ]}
        >
          <MaterialIcons name={
            field === 'company_code' ? 'closed-caption-off' : field === 'user' ? 'person' : 'password'
          } size={20} color={ERP_COLOR_CODE.ERP_999} />

          <TextInput
            style={[
              styles.input,
              inputStyle,
              { paddingRight: showToggle && secureTextEntry ? 36 : 12 },
            ]}
            secureTextEntry={secureTextEntry && !showPassword}
            {...rest}
          />
        </View>

        {showToggle && secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(s => !s)}
            style={styles.toggleButton}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <MaterialIcons
              name={!showPassword ? 'visibility-off' : 'visibility'}
              color={ERP_COLOR_CODE.ERP_999}
              size={20}
            />
          </TouchableOpacity>
        )}

        {icon}
      </View>

      

      {helperText && !error && <TranslatedText 
      text={helperText}
      numberOfLines={1}
    
      style={[styles.helperText, helperStyle]}></TranslatedText>}
       {touched && !!error && (
        <Animated.Text
          style={[
            styles.errorText,
            errorStyle,
            {
              opacity: errorAnim,
              transform: [
                {
                  translateX: errorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-38, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
};

export default ERPTextInput;

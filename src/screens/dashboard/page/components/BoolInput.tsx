import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import { useAppSelector } from '../../../../store/hooks';
import useTranslations from '../../../../hooks/useTranslations';
import TranslatedText from '../../tabs/home/TranslatedText';

type BoolInputProps = {
  value: any;
  onChange: (val: boolean) => void;
  label?: string;
};

const BoolInput = ({ value, onChange, label }: BoolInputProps) => {
  const theme = useAppSelector(state => state?.theme.mode);
  const { t } = useTranslations();

  return (
    <View style={{ marginBottom: 10 }}>
      {label && <TranslatedText
      
      style={[{ marginBottom: 12, fontWeight: '600' }, theme === 'dark' && { color: 'white' }]}
      numberOfLines={1}
      text={label}
      
      ></TranslatedText>}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={[styles.radio, value && styles.radioSelected]}
          onPress={() => onChange(true)}
        >
          {value && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(true)}
        >
        <Text style={[{ marginRight: 16, }, theme === 'dark' && { color: 'white' }]}>{t("title.title7")}</Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radio, !value && styles.radioSelected]}
          onPress={() => onChange(false)}
        >
          {!value && <View style={styles.radioInner} />}
        </TouchableOpacity>
         <TouchableOpacity
          onPress={() => onChange(false)}
        >
        <Text style={[theme === 'dark' && { color: 'white' }]}>{t("title.title8")}</Text>

        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: ERP_COLOR_CODE.ERP_333,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  radioSelected: {
    borderColor: ERP_COLOR_CODE.ERP_COLOR,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ERP_COLOR_CODE.ERP_COLOR,
  },
});

export default BoolInput;

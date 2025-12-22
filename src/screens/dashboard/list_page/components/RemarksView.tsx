import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import { useAppSelector } from '../../../../store/hooks';
import useTranslations from '../../../../hooks/useTranslations';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RemarksView = ({ remarks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useAppSelector(state => state?.theme.mode);
  const { t } = useTranslations();

  if (!remarks) return null;

  // Show button only when text > 60 chars
  const isLongText = remarks.length > 60;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  };

  return (
    <View style={{ paddingHorizontal: 4, paddingVertical: 2, borderColor: '#E5E7EB', width: '100%' }}>
      <Text
        numberOfLines={isExpanded ? undefined : 2}
        style={{
          color: theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_777,
          fontStyle: 'italic',
          fontWeight: '500',
          fontSize: 13,
          lineHeight: 18,
        }}
      >
        {remarks}
      </Text>

      {isLongText && (
        <TouchableOpacity
          onPress={toggleExpand}
          activeOpacity={0.7}
          style={{
            alignSelf: 'flex-start',
            marginTop: 4,
            backgroundColor: '#EEF2FF',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontWeight: '600',
              fontSize: 12,
              color: ERP_COLOR_CODE.ERP_COLOR,
            }}
          >
            {isExpanded ? t("text.text32") : t("text.text33")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default RemarksView;
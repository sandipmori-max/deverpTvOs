import React from 'react';
import { Image, View } from 'react-native';
import { TabIconProps } from './type';
import { getBottomTabIcon } from '../../utils/helpers';
import { styles } from './tab_style';
import { useAppSelector } from '../../store/hooks';
import { ERP_COLOR_CODE } from '../../utils/constants';

const TabIcon: React.FC<TabIconProps & { focused: boolean }> = ({ name, color, size, focused }) => {
  const iconSource = getBottomTabIcon(name, focused);
  const theme = useAppSelector(state => state.theme.mode);

  return (
    <View style={styles.container}>
      {focused && <View style={[styles.activeLine, {
        backgroundColor: theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_APP_COLOR
      }]} />}
      <Image source={iconSource} style={styles.icon(size, focused, color)} />
    </View>
  );
};

export default TabIcon;

import { StyleSheet } from 'react-native';

export const baseStyle = (color: string, isMenu: boolean) =>
  StyleSheet.create({
    container: {
      height: 28,
      width: 28,
      borderWidth: isMenu ? 0 : 1,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
      borderRadius: 4,
    },
  }).container;

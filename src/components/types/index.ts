import { TextInputProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
export interface TabIconProps {
  name: string;
  color: string;
  size: number;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  onDone?: (remarks?: any) => void;
  onCancel?: () => void;
  doneText?: string;
  cancelText?: string;
  isFromButtonList?: boolean,
  actionLoader: any,
  color?: string;
  isBottomButtonVisible?: any,
  isSettingVisible?: boolean
}

export type DrawerItemConfig = {
  label: string;
  route: string;
  icon?: string;
};

export interface ERPTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
  helperText?: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  icon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  helperStyle?: StyleProp<TextStyle>;
}

export interface ErrorMessageProps {
  message: string;
  visible?: boolean;
}
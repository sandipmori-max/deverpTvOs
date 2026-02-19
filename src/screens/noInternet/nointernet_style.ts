import { StyleSheet } from 'react-native';
import { ERP_COLOR_CODE } from '../../utils/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gif: {
    width: 250,
    height: 280,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 30,
    tintColor: '#FF6B6B',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  button: {
  backgroundColor: '#2563EB',
  paddingVertical: 14,
  paddingHorizontal: 48,
  borderRadius: 12,

  // iOS shadow
  shadowColor: '#2563EB',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 8,

  elevation: 6,

  alignItems: 'center',
  justifyContent: 'center',
},

buttonText: {
  color: ERP_COLOR_CODE.ERP_WHITE,
  fontSize: 16,
  fontWeight: '700',
  letterSpacing: 0.5,
},
});

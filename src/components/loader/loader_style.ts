import { StyleSheet } from 'react-native';
import { ERP_COLOR_CODE } from '../../utils/constants';

export const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
    width: '100%',
  },
  gif: {
    width: 200,
    height: 200,
  },  
  title: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color:'black'
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
});

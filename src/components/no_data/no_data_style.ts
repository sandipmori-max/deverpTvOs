import { StyleSheet, Dimensions } from 'react-native';
import { ERP_COLOR_CODE } from '../../utils/constants';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:ERP_COLOR_CODE.ERP_WHITE
  },
  image: {
    width: width * 0.1,
    height: width * 0.1,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: ERP_COLOR_CODE.ERP_333,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: ERP_COLOR_CODE.ERP_888,
    textAlign: 'center',
    maxWidth: '80%',
  },
});

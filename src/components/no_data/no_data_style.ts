import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('screen');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#fff'
  },
  image: {
    width: width * 0.2,
    height: width * 0.2,
    marginBottom: 20,
    opacity: 0.9,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    maxWidth: '80%',
  },
});

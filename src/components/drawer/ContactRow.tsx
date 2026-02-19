import MaterialIcons from '@react-native-vector-icons/material-icons';
import { View, Text, Linking, TouchableOpacity } from 'react-native';
import { ERP_COLOR_CODE } from '../../utils/constants';
import { useAppSelector } from '../../store/hooks';
const ContactRow = () => {
  const phoneNumber = '7935312554';
  const emailAddress = 'support@deverp.com';
  const theme = useAppSelector(state => state.theme.mode);

  const handlePhonePress = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${emailAddress}`);
  };

  return (
    <View style={{ marginVertical: 4, flexDirection: 'row', gap: 12 }}>
      {/* Phone */}
      <TouchableOpacity
        onPress={handlePhonePress}
        style={{
          flexDirection: 'row',
          gap: 4,
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialIcons
          size={14}
          color={theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_BLACK}
          name="phone"
        />
        <Text style={{
          color: theme === 'dark' ? 'white' : 'black'
        }}>{phoneNumber}</Text>
      </TouchableOpacity>

      {/* Email */}
      <TouchableOpacity
        onPress={handleEmailPress}
        style={{
          flexDirection: 'row',
          gap: 4,
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialIcons
          size={14}
          color={theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_BLACK}
          name="email"
        />
        <Text style={{
          color: theme === 'dark' ? 'white' : 'black'
        }}>{emailAddress}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ContactRow;

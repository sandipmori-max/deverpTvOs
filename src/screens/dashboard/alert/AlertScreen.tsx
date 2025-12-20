import React from 'react';
import { View, FlatList } from 'react-native';
import { styles } from './alert_style';
import { NOTIFICATIONS } from '../../../constants';
import { NotificationItem } from './components/alert_row_item';

const NotificationScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={NOTIFICATIONS}
                    keyExtractor={(item, index) => index.toString()}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <NotificationItem item={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default NotificationScreen;

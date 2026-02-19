import React, { useEffect, useLayoutEffect } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import FullViewLoader from '../../../components/loader/FullViewLoader';
import { ERP_COLOR_CODE } from '../../../utils/constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector } from '../../../store/hooks';
import useTranslations from '../../../hooks/useTranslations';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const theme = useAppSelector(state => state.theme.mode);
  const { t } = useTranslations();

  // Get URL from navigation params
  const passedUrl = route?.params?.url;
  const title = route?.params?.titlePage || ""

  // Default URL (same as existing)
  const defaultUrl =
    Platform.OS === 'ios'
      ? 'https://www.deverp.com/index.aspx?q=deverp_privacy_policy'
      : 'http://www.deverp.com/index.aspx?q=deverp_privacy_policy';

  const finalUrl = passedUrl ?? defaultUrl;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme === 'dark' ? 'black' : ERP_COLOR_CODE.ERP_APP_COLOR,
      },
      headerBackTitle: '',
      headerTintColor: '#fff',
      headerTitle: () => (
        <Text
          numberOfLines={1}
          style={{
            maxWidth: 180,
            fontSize: 18,
            fontWeight: '700',
            color: theme === 'dark' ? 'white' : ERP_COLOR_CODE.ERP_WHITE,
          }}
        >
          {title || t('title.title19')}
        </Text>
      ),
    });
  }, [navigation, theme]);

  return (
    <SafeAreaView style={styles.container}>
       
      <WebView
        source={{ uri: finalUrl }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={false}
        style={styles.webview}
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <FullViewLoader isShowTop={false} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
  },
});

export default PrivacyPolicyScreen;

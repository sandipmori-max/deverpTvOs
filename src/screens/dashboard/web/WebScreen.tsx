// import { SafeAreaView, StatusBar, Text, View } from 'react-native';
// import React, {
//   useEffect,
//   useLayoutEffect,
//   useMemo,
//   useRef,
//   useState,
// } from 'react';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import WebView from 'react-native-webview';
// import { ERP_COLOR_CODE } from '../../../utils/constants';
// import useTranslations from '../../../hooks/useTranslations';
// import FullViewLoader from '../../../components/loader/FullViewLoader';
// import { styles } from './web_style';
// import { useBaseLink } from '../../../hooks/useBaseLink';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ERPIcon from '../../../components/icon/ERPIcon';
// import { useAppSelector } from '../../../store/hooks';

// const WebScreen = () => {
//   const { t } = useTranslations();
//   const navigation = useNavigation<any>();
//   const route = useRoute<any>();
//   const { item, isFromChart } = route.params;

//   const [token, setToken] = useState<string>('');
//   const [isHidden, setIsHidden] = useState(false);
//   const [isReloading, setIsReloading] = useState(false);
//   const [webKey, setWebKey] = useState(Date.now());

//   const webviewRef = useRef<WebView>(null);
//   const baseLink = useBaseLink();
//   const theme = useAppSelector(state => state?.theme.mode);

//   const url = isFromChart
//     ? `${baseLink}app/index.html?dashboard/0/&token=${token}`
//     : '';

//   /* ------------------ TOKEN LOAD ------------------ */
//   useEffect(() => {
//     const loadToken = async () => {
//       try {
//         const storedToken = await AsyncStorage.getItem('erp_token');
//         setToken(storedToken || '');
//       } catch (e) {
//         console.log('Token load error');
//       }
//     };
//     loadToken();
//   }, []);

//   /* ------------------ SAFE CLEANUP ------------------ */
//   useEffect(() => {
//     return () => {
//       try {
//         webviewRef.current?.stopLoading();
//       } catch (e) {}
//     };
//   }, []);

//   /* ------------------ TOGGLE DIV ------------------ */
//   const toggleDiv = () => {
//     const jsCode = `
//       (function() {
//         try {
//           const div = document.getElementById('divPage');
//           if (div) {
//             div.style.display = '${isHidden ? 'block' : 'none'}';
//           }
//         } catch(e){}
//       })();
//       true;
//     `;
//     webviewRef.current?.injectJavaScript(jsCode);
//     setIsHidden(prev => !prev);
//   };

//   /* ------------------ RELOAD WEBVIEW ------------------ */
//   const reloadWebView = () => {
//     try {
//       setWebKey(Date.now());
//       webviewRef.current?.reload();
//     } catch (e) {}
//   };

//   /* ------------------ HEADER OPTIONS ------------------ */
//   useLayoutEffect(() => {
//     navigation.setOptions({
//       headerBackTitle: '',
//       headerStyle: {
//         backgroundColor:
//           theme === 'dark'
//             ? 'black'
//             : ERP_COLOR_CODE.ERP_APP_COLOR,
//       },
//       headerTitle: () => (
//         <Text
//           numberOfLines={1}
//           style={{
//             maxWidth: 180,
//             fontSize: 18,
//             fontWeight: '700',
//             color: 'white',
//           }}
//         >
//           {isFromChart
//             ? t('text.text52')
//             : item?.title || t('webScreen.details')}
//         </Text>
//       ),
//       headerRight: () => (
//         <>
//           <ERPIcon name={'refresh'} onPress={reloadWebView} />
//           {!isFromChart && item?.title !== 'Attendance Code' && (
//             <ERPIcon
//               name={isHidden ? 'close' : 'filter-alt'}
//               onPress={toggleDiv}
//             />
//           )}
//         </>
//       ),
//     });
//   }, [navigation, item?.title, t, isHidden, theme]);

//   /* ------------------ TARGET URL ------------------ */
//   const targetUrl = useMemo(() => {
//     const itemUrl = item?.url || '';
//     return `${baseLink}${itemUrl}&token=${token}`;
//   }, [baseLink, item?.url, token]);

//   /* ------------------ LOADING CHECK ------------------ */
//   if ((!isFromChart && !targetUrl) || (isFromChart && !url)) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <FullViewLoader isShowTop={false} />
//       </SafeAreaView>
//     );
//   }

//   /* ------------------ MAIN RETURN ------------------ */
//   return (
//     <SafeAreaView style={styles.container}>
//       <View
//         style={{
//           height: 16,
//           width: '100%',
//           backgroundColor:
//             theme === 'dark'
//               ? 'black'
//               : ERP_COLOR_CODE.ERP_APP_COLOR,
//           borderBottomLeftRadius: 12,
//           borderBottomRightRadius: 12,
//         }}
//       />

//       <StatusBar
//         backgroundColor={
//           theme === 'dark'
//             ? 'black'
//             : ERP_COLOR_CODE.ERP_APP_COLOR
//         }
//         translucent={false}
//       />

//       {token ? (
//         <WebView
//           key={webKey}
//           ref={webviewRef}
//           source={{ uri: isFromChart ? url : targetUrl }}
//           javaScriptEnabled={true}
//           domStorageEnabled={true}
//           cacheEnabled={false}
//           incognito={false}
//           startInLoadingState={true}
//           style={styles.webview}
//           showsHorizontalScrollIndicator={false}
//           showsVerticalScrollIndicator={false}
//           bounces={false}
//           scrollEnabled={true}
//           allowsBackForwardNavigationGestures={true}
//           textZoom={100}
//           allowsLinkPreview={false}
//           onLoadStart={() => {
//             setIsReloading(true);
//           }}
//           onLoadEnd={() => {
//             setIsReloading(false);
//           }}
//           onError={() => {
//             setIsReloading(false);
//           }}
//           injectedJavaScript={`
//             (function() {
//               try {
//                 const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
//                 const allClasses = Array.from(document.querySelectorAll('[class]')).map(el => el.className);
//                 window.ReactNativeWebView.postMessage(JSON.stringify({ ids: allIds, classes: allClasses }));
//               } catch(e){}
//             })();
//             true;
//           `}
//           // onMessage={event => {
//           //   try {
//           //     JSON.parse(event.nativeEvent.data);
//           //   } catch (e) {
//           //     console.log('Invalid message received');
//           //   }
//           // }}
//           renderLoading={() => (
//             <View
//               style={[
//                 styles.webviewLoadingContainer,
//                 theme === 'dark' && { backgroundColor: 'black' },
//               ]}
//             >
//               <FullViewLoader isShowTop={false} />
//             </View>
//           )}
//         />
//       ) : (
//         <FullViewLoader />
//       )}
//     </SafeAreaView>
//   );
// };

// export default WebScreen;
import { SafeAreaView, StatusBar, Text, View } from 'react-native';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import WebView from 'react-native-webview';
import { ERP_COLOR_CODE } from '../../../utils/constants';
import useTranslations from '../../../hooks/useTranslations';
import FullViewLoader from '../../../components/loader/FullViewLoader';
import { styles } from './web_style';
import { useBaseLink } from '../../../hooks/useBaseLink';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ERPIcon from '../../../components/icon/ERPIcon';
import { useAppSelector } from '../../../store/hooks';

const WebScreen = () => {
  const { t } = useTranslations();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { item, isFromChart } = route.params;
  const [token, setToken] = useState<string>('');
  const [isHidden, setIsHidden] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const webviewRef = useRef<WebView>(null);
  const baseLink = useBaseLink();
  const theme = useAppSelector(state => state?.theme.mode);

  const url = isFromChart ? `${baseLink}app/index.html?dashboard/0/&token=${token}` : '';


  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem('erp_token');
      setToken(storedToken || '');
    })();
  }, []);

  useEffect(() => {
    return () => {
      try {
        webviewRef.current?.clearCache(true);
        webviewRef.current?.clearHistory();
      } catch (e) {
      }
    };
  }, []);


  const toggleDiv = () => {
    const jsCode = `
      (function() {
        const div = document.getElementById('divPage');
        if (div) {
          div.style.display = '${isHidden ? 'block' : 'none'}';
        }
      })();
      true;
    `;
    webviewRef?.current?.injectJavaScript(jsCode);
    setIsHidden(prev => !prev);
  };
  const [webKey, setWebKey] = useState(Date.now());

  useEffect(() => {
    return () => {
      setWebKey(Date.now());
    };
  }, []);


  const reloadWebView = () => {
    setWebKey(Date.now());

    setIsReloading(true);
    try {
      webviewRef.current?.clearCache(true);
      webviewRef.current?.clearHistory();
    } catch (e) {
    }
    webviewRef.current?.reload();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text
          numberOfLines={1}
          style={{ maxWidth: 180, fontSize: 18, fontWeight: '700', color: 'white' }}
        >
          {isFromChart ? t("text.text52") : item?.title || t('webScreen.details')}
        </Text>
      ),
      headerRight: () => (
        <>
          {isFromChart || item?.title === 'Attendance Code' ? (
            <>
              <ERPIcon name={'refresh'} onPress={reloadWebView} />
            </>
          ) : (
            <>
              <ERPIcon name={'refresh'} onPress={reloadWebView} />
              <ERPIcon name={isHidden ? 'close' :'filter-alt'}
               onPress={toggleDiv} />
            </>
          )}
        </>
      ),
    });
  }, [navigation, item?.title, t, isHidden]);

  const targetUrl = useMemo(() => {
    const itemUrl = item?.url || '';
    return `${baseLink}${itemUrl}&token=${token}`;
  }, [baseLink, item?.url, token]);

  if ((!isFromChart && !targetUrl) || (isFromChart && !url)) {
    return (
      <SafeAreaView style={styles.container}>
        <FullViewLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={ERP_COLOR_CODE.ERP_APP_COLOR} translucent={false} />
      {token ? (
        <>
          <WebView
            ref={webviewRef}
            source={{ uri: isFromChart ? url : targetUrl }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={false}
            style={styles.webview}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEnabled={true}
            decelerationRate={0.998}
            cacheEnabled={true}
            incognito={true}
            cacheMode="LOAD_DEFAULT"
            renderLoading={() => (
              <View style={[styles.webviewLoadingContainer, theme === 'dark' && {
                backgroundColor: "black"
              }]}>
                <View style={[styles.webviewLoadingContent, theme === 'dark' && {
                  backgroundColor: 'black'
                }]}>
                  <FullViewLoader isShowTop={false} />
                </View>
              </View>
            )}
            allowsBackForwardNavigationGestures={true}
            textZoom={100}
            allowsLinkPreview={false}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              setIsReloading(false);
            }}
            onLoadStart={() => {
              webviewRef.current?.clearCache(true);
              webviewRef.current?.clearHistory();
              setIsReloading(true);
            }}
            onLoadEnd={() => {
              setIsReloading(false);
              // const jsCode = `
              //   (function() {
              //     const div = document.getElementById('divPage');
              //     if (div) {
              //       div.style.display = 'none';
              //     }
              //   })();
              //   true;
              // `;
              // webviewRef.current?.injectJavaScript(jsCode);
              // setIsHidden(true)
            }}
            injectedJavaScript={`
              (function() {
                const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
                const allClasses = Array.from(document.querySelectorAll('[class]')).map(el => el.className);
                window.ReactNativeWebView.postMessage(JSON.stringify({ ids: allIds, classes: allClasses }));
              })();
              true;
            `}
            onMessage={event => {
              const data = JSON.parse(event.nativeEvent.data);
             }}
          />
        </>
      ) : (
        <FullViewLoader isShowTop={false}/>
      )}
    </SafeAreaView>
  );
};

export default WebScreen;

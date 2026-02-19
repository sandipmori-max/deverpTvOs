import React, { useState, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import WebView from 'react-native-webview';
import RenderHTML from 'react-native-render-html';
import { useAppSelector } from '../../../../store/hooks';

const AutoHeightWebView = ({
  html,
  isFromPage,
  isHorizontal,
  isFromMenu,
  textColor,
  isFromListPage,
 }: {
  html: string;
  isFromPage?: boolean;
  isHorizontal: any;
  isFromMenu: any;
  textColor: any;
  isFromListPage: any;
   
}) => {
  const [webViewHeight, setWebViewHeight] = useState(0);
  const { width } = useWindowDimensions();
  const webviewRef = useRef<WebView>(null);
  const theme = useAppSelector(state => state?.theme.mode);
 
  const isDark = theme === "dark";

  const BG = isDark ? "#000000" : "#FFFFFF";
  const TEXT = isDark ? "#FFFFFF" : "#222222";
  const BORDER = isDark ? "#444" : "#ccc";
  const TH_BG = isDark ? "#1A1A1A" : "#f1f1f1";
  const EVEN_ROW = isDark ? "#111" : "#fafafa";
 
  const defaultCSS = `
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-y: scroll;
        overflow-x: scroll;
        background-color: ${BG} !important;
      }
      * {
        color: ${TEXT} !important;
        font-family: -apple-system, Roboto, 'Segoe UI', sans-serif !important;
        font-size: 15px !important;
        word-wrap: break-word !important;
      }
      body > *:last-child { margin-bottom: 0 !important; }
      table {
        height: 100% !important;
        width: ${isFromListPage ? '92%' :  isFromPage ? '92%' : '82%'} !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        word-break: break-word !important;
      }
      th, td {
        border: 1px solid ${BORDER} !important;
        padding: 6px !important;
        text-align: left !important;
      }
      th {
        background: ${TH_BG} !important;
        font-weight: bold !important;
      }
      tr:nth-child(even) { background: ${EVEN_ROW} !important; }
      img { max-width: 100% !important; height: auto !important; display: block !important; }
      div, p, span, h1,h2,h3,h4,h5,h6 {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    </style>
  `;

  const formattedHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        ${defaultCSS}
      </head>
      <body>${html}</body>
    </html>
  `; 
  
  const injectedJS = `
    (function() {
      function sendHeight() {
        const body = document.body;
        const html = document.documentElement;
        const height = Math.max(
          body.scrollHeight, body.offsetHeight,
          html.clientHeight, html.scrollHeight, html.offsetHeight
        );
        window.ReactNativeWebView.postMessage(height.toString());
      }

      const resizeObserver = new ResizeObserver(sendHeight);
      resizeObserver.observe(document.body);

      sendHeight();
    })();
    true;
  `;

  return (
    <View
      style={{
        overflow: 'scroll',
        width,
        backgroundColor: BG,
      }}
    >
      {html.includes('<table ') ? (
        <WebView
          ref={webviewRef}
          source={{ html: formattedHTML }}
          style={{ width, height: webViewHeight || 100, backgroundColor: BG }}
          injectedJavaScript={injectedJS}
          onMessage={event => {
            const height = Number(event.nativeEvent.data);
            if (!isNaN(height) && height > 0) {
              setWebViewHeight(height);
            }
          }}
          scrollEnabled={false}
          originWhitelist={['*']}
        />
      ) : (
        <RenderHTML
          contentWidth={width}
          source={{ html }}
          tagsStyles={{
            p: {
              fontWeight: 'bold',
              flexDirection: 'row',
              overflow: 'hidden',
              color: isFromMenu ? textColor : TEXT,
              maxWidth: isFromMenu ? '80%' : isHorizontal ? '100%' : 100,
            },
            b: {
              fontWeight: 'bold',
              flexDirection: 'row',
              overflow: 'hidden',
              color: isFromMenu ? textColor : TEXT,
              maxWidth: isFromMenu ? '80%' : isHorizontal ? '100%' : 100,
            },
            strong: {
              fontSize: 16,
              fontWeight: 'bold',
              flexDirection: 'row',
              overflow: 'hidden',
              color: isFromMenu ? textColor : TEXT,
              maxWidth: isFromMenu ? '80%' : isHorizontal ? '100%' : 100,
            },
            i: { fontStyle: 'italic' },
            div: {
              flexDirection: 'row',
              flexWrap: 'wrap',
              maxWidth: width,
              color: isFromMenu ? textColor : TEXT,
            },
          }}
        />
      )}
    </View>
  );
};

export default AutoHeightWebView;

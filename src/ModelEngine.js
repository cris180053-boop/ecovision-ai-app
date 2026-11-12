import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { WebView } from 'react-native-webview';

const asset = require('../assets/engine.html');
const modelError = 'No pudimos iniciar el modelo. Vuelve a intentarlo.';
const predictionError = 'No pudimos analizar la foto. Intenta con otra captura.';

export const ModelEngine = forwardRef(function ModelEngine({ onStateChange }, ref) {
  const [source, setSource] = useState(null);
  const webView = useRef(null);
  const ready = useRef(false);
  const pending = useRef(null);
  const nextId = useRef(0);
  const startupTimer = useRef(null);

  const fail = useCallback(() => {
    ready.current = false;
    clearTimeout(startupTimer.current);
    const job = pending.current;
    pending.current = null;
    if (job) {
      clearTimeout(job.timer);
      job.reject(new Error(modelError));
    }
    onStateChange('error');
  }, [onStateChange]);

  useEffect(() => {
    let active = true;
    startupTimer.current = setTimeout(fail, 45000);
    Asset.fromModule(asset).downloadAsync().then(file => {
      if (!active) return;
      if (!file.localUri) {
        fail();
        return;
      }
      setSource({ uri: file.localUri });
    }).catch(() => { if (active) fail(); });

    return () => {
      active = false;
      ready.current = false;
      clearTimeout(startupTimer.current);
      clearTimeout(pending.current?.timer);
      pending.current?.reject(new Error(modelError));
      pending.current = null;
    };
  }, [fail]);

  useImperativeHandle(ref, () => ({
    predict(image) {
      return new Promise((resolve, reject) => {
        if (!ready.current || !webView.current || pending.current) {
          reject(new Error(modelError));
          return;
        }
        const id = ++nextId.current;
        pending.current = { id, resolve, reject, timer: setTimeout(fail, 25000) };
        webView.current.injectJavaScript('window.classifyEcoVision(' + id + ', ' + JSON.stringify(image) + '); true;');
      });
    },
  }), [fail]);

  function receive(event) {
    let message;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message?.type === 'ready') {
      ready.current = true;
      clearTimeout(startupTimer.current);
      onStateChange('ready');
      return;
    }
    if (message?.type === 'load-error') {
      fail();
      return;
    }

    const job = pending.current;
    if (!job || job.id !== message?.id) return;
    clearTimeout(job.timer);
    pending.current = null;
    if (message.type === 'predictions') job.resolve(message.predictions);
    else job.reject(new Error(predictionError));
  }

  if (!source) return null;
  return (
    <View style={styles.hidden} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <WebView
        ref={webView}
        source={source}
        style={styles.webView}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={request => request.url === source.uri || request.url === 'about:blank'}
        allowingReadAccessToURL={source.uri}
        allowFileAccess
        javaScriptEnabled
        domStorageEnabled={false}
        onMessage={receive}
        onError={fail}
        onContentProcessDidTerminate={fail}
        onRenderProcessGone={fail}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 8, height: 8, left: 0, top: 0, opacity: 0, overflow: 'hidden' },
  webView: { flex: 1, backgroundColor: 'transparent' },
});

import React, {useEffect, useState} from 'react';
import {Platform, SafeAreaView, StyleSheet, Text} from 'react-native';
import CodePush from 'react-native-code-push';
import Config from 'react-native-config';
import {Page} from './src/Page';

const statuses = Object.keys(CodePush.SyncStatus);

const deploymentKey = Platform.select({
  ios: Config.CODE_PUSH_IOS_KEY,
  android: Config.CODE_PUSH_ANDROID_KEY,
});

function App() {
  const [syncStatus, setSyncStatus] = useState<CodePush.SyncStatus>(-1);
  const [progress, setProgress] = useState({totalBytes: 0, receivedBytes: 0});
  useEffect(() => {
    CodePush.sync(
      {
        deploymentKey,
      },
      setSyncStatus,
      next => setProgress({...next}),
    );
  }, []);
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.text}>{statuses[syncStatus]}</Text>
      <Text
        style={
          styles.text
        }>{`${progress.receivedBytes} / ${progress.totalBytes}`}</Text>
      <Page />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: 'white',
    flex: 1,
  },
  text: {
    color: 'black',
  },
});

export default App;

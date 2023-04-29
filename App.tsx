import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {Page} from './src/Page';

function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <Page />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: 'white',
    flex: 1,
  },
});

export default App;

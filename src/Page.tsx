import React from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';

const sources = [
  require('./assets/page-1.jpg'),
  require('./assets/page-2.jpg'),
  require('./assets/page-3.jpg'),
  require('./assets/page-4.jpg'),
];

export const Page = () => {
  return (
    <ScrollView>
      <View style={styles.container}>
        {sources.map((source, index) => (
          <Image source={source} key={index} style={styles.image} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    gap: 16,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});

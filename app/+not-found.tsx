import { Href, Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import React from "react";
import CustomText from "@/components/global/CustomText";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <CustomText>This screen doesn't exist.</CustomText>
        <Link href="/" style={styles.link}>
          <CustomText>Go to home screen!</CustomText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

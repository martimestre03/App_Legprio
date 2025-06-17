import React from "react";
import { View, Animated, StyleSheet } from "react-native";

const ShimmerWrapper = ({
  children,
  shimmerStyle = {},
  innerStyle,
  loading = false,
  duration = 1000,
}) => {
  const shimmerAnim = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [loading, duration]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300], // Adjust based on card size
  });

  return (
    <View style={[styles.container, shimmerStyle]}>
      {loading && (
        <Animated.View
          style={[styles.shimmerEffect, { transform: [{ translateX }] }]}
        >
          <View style={styles.shimmerGradient} />
        </Animated.View>
      )}
      {!loading && (
        <View style={[styles.innerContent, innerStyle]}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    alignItems:'center', justifyContent:'center'
  },
  shimmerEffect: {
    position: "absolute",
    width: "200%", // Extend beyond view width
    height: "100%",
  },
  shimmerGradient: {
    width: "50%", // Width of shimmer "light"
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 10, // Match outer container if applicable
  },
  innerContent: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems:'center',
    justifyContent:'center'
  },
});

export default ShimmerWrapper;

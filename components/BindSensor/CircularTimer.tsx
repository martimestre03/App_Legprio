import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  Image,
  Button,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularTimerProps {
  duration?: number; // Duration in seconds (default: 60)
  size?: number; // Diameter of the circle
  strokeWidth?: number; // Stroke width of the circle
  color?: string; // Progress color
  backgroundColor?: string; // Background circle color
  onComplete?: () => void; // Callback when timer completes
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularTimer: React.FC<CircularTimerProps> = ({
  duration = 60,
  size = 100,
  strokeWidth = 10,
  color = "#3498db",
  backgroundColor = "#e0e0e0",
  onComplete,
}) => {
  // Animated value for the circle's strokeDashoffset
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [remainingTime, setRemainingTime] = useState(duration);

  // Circle calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Start the animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration * 1000, // Convert duration to milliseconds
      easing: Easing.linear,
      useNativeDriver: false, // `strokeDashoffset` is not supported with native driver
    }).start(({ finished }) => {
      if (finished && onComplete) {
        onComplete();
      }
    });

    // Countdown timer
    const interval = setInterval(() => {
      setRemainingTime((time) => {
        if (time <= 1) {
          clearInterval(interval);
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      animatedValue.stopAnimation();
    };
  }, [duration, onComplete]);

  // Animate the strokeDashoffset
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke={backgroundColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <AnimatedCircle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      {/* Remaining Time Text */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          style={styles.signalImage}
          resizeMode="contain"
          source={require("@/assets/images/sensorExample.gif")}
        />
        <CustomText style={{ fontSize: 22, fontWeight: "500", textAlign: "center" }}>
          Hold the button for 3s
        </CustomText>
      </View>
      <View style={{ width: "100%", alignItems: "center", marginTop: 15 }}>
        <CustomText style={{ fontSize: 25, color: "#ccc" }}>{remainingTime}s</CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  signalImage: {
    width: 150,
    height: 150,
    marginLeft: 10,
  },
  scrollViewContent: {
    paddingHorizontal: "5%",
    width: "100%",
  },
  headerText: {
    fontSize: 30,
    fontWeight: "700",
    marginVertical: 10,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: "5%",
    width: "100%",
    backgroundColor: "#F0F4F8",
  },
  headerStyle: {
    backgroundColor: "#F0F4F8", // Set background color of the header
  },
});

export default CircularTimer;

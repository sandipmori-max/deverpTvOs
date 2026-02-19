import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import TabIcon from "./TabIcon";

interface Props {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}

const AnimatedTabIcon: React.FC<Props> = ({
  name,
  color,
  size,
  focused,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.08,
          damping: 10,
          stiffness: 120,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: -3,
          damping: 10,
          stiffness: 120,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 140,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 12,
          stiffness: 140,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }, { translateY }],
        opacity,
      }}
    >
      <TabIcon
        name={name}
        color={color}
        size={size}
        focused={focused}
      />
    </Animated.View>
  );
};

export default AnimatedTabIcon;

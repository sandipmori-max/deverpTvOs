import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERP_COLOR_CODE } from '../../utils/constants';
import FullViewLoader from '../../components/loader/FullViewLoader';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import FastImage from 'react-native-fast-image';
import { ERP_GIF } from '../../assets';

const { width, height } = Dimensions.get('window');
const slides = [
  {
    id: '1',
    title: 'Welcome to DevERP Connect',
    desc: 'Experience the power of integrated ERP software to manage entire business processes with real-time control and efficiency.',
    image: ERP_GIF.Dashboards,
    bgColor: ['#f8b6c1', '#FAD4D8'],
    statusBar: '#f8b6c1',
    layout: { titleY: -40, descY: 0, align: 'center' },
  },
  {
    id: '2',
    title: 'End-to-End Business Control',
    desc: 'From customer orders to invoicing, DevERP Connect unifies sales, finance, inventory, HR, and plant operations in one seamless platform.',
    image: ERP_GIF.Analytics,
    bgColor: ['#b2cffa', '#D4E6F1'],
    statusBar: '#b2cffa',
    layout: { titleY: -20, descY: 10, align: 'left' },
  },
  {
    id: '3',
    title: 'Smart Production Operations',
    desc: 'Monitor plc scada and manual procedure to track raw materials, semi finished goods and finish goods with packing and dispatch in real time. Ensure accuracy and efficiency across every production process.',
    image: ERP_GIF.money,
    bgColor: ['#8de0d2', '#D1F2EB'],
    statusBar: '#8de0d2',
    layout: { titleY: -30, descY: 10, align: 'right' },
  }, 
  {
    id: '4',
    title: 'Grow with Confidence',
    desc: 'Use built-in reports and dashboards to reduce waste, optimize costs, and scale business operations efficiently with DevERP.',
    image: ERP_GIF.RemoteMonitoring,
    bgColor: ['#c6b6f8', '#E8DAEF'],
    statusBar: '#c6b6f8',
    layout: { titleY: -20, descY: 10, align: 'center' },
  },
];


const Onboarding = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const waveAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      startWaveAnimation();
    }
    checkOnboardStatus();
  }, []);

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: currentIndex,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const checkOnboardStatus = async () => {
    try {
      const seen = await AsyncStorage.getItem('onboardSeen'); 
      if (seen) {
        navigation.replace('Login');
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  if (loading) return <>
    <FullViewLoader isShowTop={false}/>
  </>;

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 15, duration: 1800, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: -15, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = () => {
    animatePress();
    if (currentIndex < slides.length - 1)
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
  };

  const handlePrev = () => {
    animatePress();
    if (currentIndex > 0)
      flatListRef.current.scrollToIndex({ index: currentIndex - 1 });
  };

  const handleSkip = async () => {
    animatePress();
    await AsyncStorage.setItem('onboardSeen', 'true');
    navigation.replace('Login');
  };

  const handleScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(x / width));
  };
 


  const renderItem = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0] });

    const translateYTitle = scrollX.interpolate({
      inputRange,
      outputRange: [item.layout.titleY + 30, item.layout.titleY, item.layout.titleY + 30],
    });

    const translateYDesc = scrollX.interpolate({
      inputRange,
      outputRange: [item.layout.descY + 30, item.layout.descY, item.layout.descY + 30],
    });

    const alignStyle =
      item.layout.align === 'left'
        ? { alignSelf: 'flex-start', textAlign: 'left' }
        : item.layout.align === 'right'
          ? { alignSelf: 'flex-end', textAlign: 'right' }
          : { alignSelf: 'center', textAlign: 'center' };

    return (
      <View style={[styles.slide, { width }]}>
        <FastImage
          source={item?.image}
          style={{
            height: 190,
            width: 180,
            marginBottom: 20
          }}
          resizeMode={FastImage.resizeMode.contain}
        />

        <Animated.Text
          style={[
            styles.title,
            alignStyle,
            {
              opacity,
              transform: [{ translateY: translateYTitle }],
            },
          ]}
        >
          {item.title}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.desc,
            alignStyle,
            {
              opacity,
              transform: [{ translateY: translateYDesc }],
            },
          ]}
        >
          {item.desc}
        </Animated.Text>
      </View>
    );
  };

  const bgColor = bgAnim.interpolate({
    inputRange: slides.map((_, i) => i),
    outputRange: slides.map((s) => s.bgColor[0]),
  });

  const bgColor2 = bgAnim.interpolate({
    inputRange: slides.map((_, i) => i),
    outputRange: slides.map((s) => s.bgColor[1]),
  });

 

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: 0.6, backgroundColor: bgColor2 }]}
      />

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.wave,
          {
            transform: [{ translateY: waveAnim }],
            backgroundColor: 'rgba(255,255,255,0.35)',
          },
        ]}
      />

      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleScroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      />

      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <View
              key={index}
              style={[styles.dot, isActive ? styles.activeDot : styles.inactiveDot]}
            />
          );
        })}
      </View>

      <View style={styles.bottomBar}>
        {currentIndex > 0 ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable style={styles.circleBtn} onPress={handlePrev}>
              <MaterialIcons name="arrow-back" size={24} color="#444" />
            </Pressable>
          </Animated.View>
        ) : (
          <View style={{ width: 55 }} />
        )}

        {currentIndex < slides.length - 1 ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable style={styles.circleBtn} onPress={handleNext}>
              <MaterialIcons name="arrow-forward" size={24} color="#444" />
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable style={[styles.circleBtn,
             {
              backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR
            }]} onPress={handleSkip}>
              <MaterialIcons name='done-all' size={26} color="#fff" />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  wave: {
    position: 'absolute',
    bottom: -height * 0.15,
    width: width * 2,
    height: height * 0.45,
    borderTopLeftRadius: width,
    borderTopRightRadius: width,
    alignSelf: 'center',
  },

  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  title: {
    fontSize: 34,
    fontWeight: '600',
    color: '#1e1e1e',
  },

  desc: {
    fontSize: 17,
    color: '#333',
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 6 },
  activeDot: { backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR, width: 22 },
  inactiveDot: { backgroundColor: '#bbb' },

  skipBtn: {
    marginTop: Platform.OS === 'ios' ? 0 : 45,
    alignSelf: 'flex-end',
    padding: 15,
    zIndex: 10,
  },
  skipText: { color: ERP_COLOR_CODE.ERP_APP_COLOR, fontWeight: '700', fontSize: 16 },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingBottom: 30,
  },
  circleBtn: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
});

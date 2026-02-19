import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

const useKeyboardVisible = (): boolean => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleShow = () => setKeyboardVisible(true);
    const handleHide = () => setKeyboardVisible(false);
    const showSub = Keyboard.addListener('keyboardDidShow', handleShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', handleHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardVisible;
};

export default useKeyboardVisible;

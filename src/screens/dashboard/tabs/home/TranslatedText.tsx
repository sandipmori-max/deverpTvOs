import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useAppSelector } from "../../../../store/hooks";

const translateSingle = async (text, langCode) => {
  console.log("langCode", langCode)
  return text;
  // if(langCode === 'en'){
  //   return text;
  // }
  // try {

  //   const params = new URLSearchParams({
  //     q: text,
  //     langpair: `en|${langCode}`,
  //   });

  //   const response = await fetch(
  //     `https://api.mymemory.translated.net/get?${params.toString()}`
  //   );

  //   const result = await response.json();
  //   return result.responseData.translatedText;
  // } catch (error) {
  //   console.log("Translation failed");
  //   return text;
  // }
};


const TranslatedText = ({ text, style, numberOfLines }) => {
  // const [translated, setTranslated] = useState(text);
  //   const langCode = useAppSelector(state => state.theme.langcode);
  

  // useEffect(() => {
  //   let isMounted = true;

  //   const doTranslate = async () => {
  //     const result = await translateSingle(text, langCode);
  //     if (isMounted) {
  //       setTranslated(result);
  //     }
  //   };

  //   if (text) {
  //     doTranslate();
  //   }

  //   return () => {
  //     isMounted = false;
  //   };
  // }, [text]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {text}
    </Text>
  );
};

export default TranslatedText;

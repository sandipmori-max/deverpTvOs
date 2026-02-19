import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TranslatedText from "./TranslatedText";

const HTMLTable = ({ html }) => {
  const rows = Array.from(html.matchAll(/<tr>(.*?)<\/tr>/g)).map(r =>
    Array.from(r[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/g)).map(c =>
      c[1].replace(/<[^>]+>/g, "").trim()
    )
  );
  return (
    <View style={styles.table}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={styles.cell}>
              <TranslatedText 
              numberOfLines={1}
              text={cell}
              style={styles.text}></TranslatedText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    height: 250,
    borderColor: "#ccc",
    width: "100%",
    marginVertical: 5,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 6,
  },
  text: {
    fontSize: 14,
  },
});

export default HTMLTable;

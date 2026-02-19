import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { ERP_COLOR_CODE } from '../../../../utils/constants';
import RNFS from 'react-native-fs';
import { Linking } from 'react-native';
import useTranslations from '../../../../hooks/useTranslations';

interface FileType {
  name: string;
  uri: string;
  size?: number;
  type?: string;
}

const FilePickerRow = ({ item, handleAttachment, baseLink, infoData, isFromFileManager = false, onFilePicked }) => {
  const { t } = useTranslations();
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png',
    'mov', 'avi',
    'pdf',
    'doc', 'docx',
    'xls', 'xlsx',
  ];

  const base = `${baseLink}fileupload/1/${infoData?.tableName}/${infoData?.id}/${item?.text}`;
  const [selectedFiles, setSelectedFiles] = useState<FileType[]>([]);

  const openFilePicker = async () => {
    try {
      const files = await pick({
        type: [types.allFiles],
      });
      setSelectedFiles(prev => [...prev, ...files]);
      const file = files[0];

      let filePath = files[0].uri;
      const extension = file.name?.split('.').pop()?.toLowerCase();

      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        Alert.alert(
          t("title.title1"),
          t("Selected file type is not supported")
        );
        return;
      }
      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert(
          t("title.title1"),
          t("File size must be less than or equal to 25MB")
        );
        return;
      }
      if (Platform.OS === 'android' && files[0].uri.startsWith('content://')) {
        const destPath = `${RNFS.TemporaryDirectoryPath}/${files[0].name}`;
        await RNFS.copyFile(files[0].uri, destPath);
        filePath = destPath;
      }
      if (isFromFileManager && onFilePicked) {
        onFilePicked(files[0]);
        return;
      }
      const fileBase64 = await RNFS.readFile(filePath, 'base64');

      handleAttachment(
        `${files[0].name}; data:${files[0].nativeType};base64,${fileBase64}`,
        item.field,
      );
    } catch (err: any) {
      if (err.code === 'USER_CANCELED') {
      } else {
        Alert.alert(t("title.title1"), t("msg.msg12"));
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFile = async (index: number) => {
    try {
      const [file] = await pick({ type: [types.allFiles] });
      setSelectedFiles(prev => prev.map((f, i) => (i === index ? file : f)));
    } catch (err: any) {
      if (err.code === 'USER_CANCELED') return;
      Alert.alert(t("title.title1"), t("msg.msg13"));
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return 'insert-drive-file';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'movie';
      case 'pdf':
        return 'picture-as-pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'grid-on';
      default:
        return 'insert-drive-file';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{item?.fieldtitle}</Text>
      {!isFromFileManager && selectedFiles.length === 0 && (
        <>
          {item?.text !== '' && (
            <View style={{ marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  if (base) {
                    Linking.openURL(base).catch(err => console.error('Failed to open link:', err));
                  }
                }}
              >
                <Text style={{ color: 'blue', textDecorationLine: 'underline' }}>{base}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <ScrollView showsHorizontalScrollIndicator={false}>
        {!isFromFileManager && selectedFiles.map((file, index) => (
          <View key={index} style={styles.fileRow}>
            <View style={{ flexDirection: 'row' }}>
              <MaterialIcons
                name={getFileIcon(file.name)}
                size={24}
                color={ERP_COLOR_CODE.ERP_555}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.updateBtn} onPress={() => updateFile(index)}>
                <MaterialIcons name="edit" size={18} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFile(index)}>
                <MaterialIcons name="delete" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {!isFromFileManager && selectedFiles.length === 0 && (
          <TouchableOpacity style={styles.addBtn} onPress={openFilePicker}>
            <MaterialIcons name="add" size={20} color={ERP_COLOR_CODE.ERP_WHITE} />
            <Text style={[styles.btnText, { marginLeft: 4 }]}>{t("text.text36")}</Text>
          </TouchableOpacity>
        )}
        {
          isFromFileManager && <TouchableOpacity style={styles.addBtn} onPress={openFilePicker}>
            <MaterialIcons name="add" size={20} color={ERP_COLOR_CODE.ERP_WHITE} />
            <Text style={[styles.btnText, { marginLeft: 4 }]}>{t("text.text36")}</Text>
          </TouchableOpacity>
        }
      </ScrollView>
    </View>
  );
};

export default FilePickerRow;

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    backgroundColor: ERP_COLOR_CODE.ERP_WHITE,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: ERP_COLOR_CODE.ERP_APP_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  updateBtn: {
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  removeBtn: {
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  fileName: {
    maxWidth: 120,
    fontSize: 14,
    marginRight: 8,
  },
  btnText: {
    color: ERP_COLOR_CODE.ERP_WHITE,
    fontWeight: '600',
  },
});

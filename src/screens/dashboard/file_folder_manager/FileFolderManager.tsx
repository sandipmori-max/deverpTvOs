import MaterialIcons from "@react-native-vector-icons/material-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import FilePickerRow from "../page/components/FilePicker";

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------

const FileFolderManager = () => {
  const [items, setItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
const [showActionMenu, setShowActionMenu] = useState(false);
const [actionTarget, setActionTarget] = useState(null);
 
  const [newName, setNewName] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortType, setSortType] = useState("default"); // default, name, date, type

  // Move modal state
  const [moveFolderStack, setMoveFolderStack] = useState([]); // stack of folder IDs in move modal

  // ⭐ Breadcrumb
  const getBreadcrumb = () => {
    let path = [];
    let folder = items.find((i) => i.id === currentFolder);

    while (folder) {
      path.unshift(folder.name);
      folder = items.find((i) => i.id === folder.parentId);
    }
    return path.join(" / ") || "Documents";
  };

  // ----------------------------------------------------
  // ADD VALIDATION (Duplicate Name Check)
  // ----------------------------------------------------
  const isDuplicateName = (name, parentId, excludeId = null) => {
    return items.some(
      (i) =>
        i.parentId === parentId &&
        i.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        i.id !== excludeId
    );
  };

  // ----------------------------------------------------
  // ADD FOLDER OR FILE
  // ----------------------------------------------------
  const addItem = (type) => {
    if (!newName.trim()) return;

    if (isDuplicateName(newName, currentFolder)) {
      Alert.alert("Already Exists", "A folder/file with same name already exists.");
      return;
    }

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: newName,
        type,
        parentId: currentFolder,
        created: Date.now(),
        order: items.length,
      },
    ]);

    setNewName("");
    setShowAddModal(false);
  };

  // ----------------------------------------------------
  // EDIT FOLDER/FILE
  // ----------------------------------------------------
  const updateItem = () => {
    if (!newName.trim()) return;

    if (isDuplicateName(newName, selectedItem.parentId, selectedItem.id)) {
      Alert.alert("Already Exists", "Another item with this name already exists.");
      return;
    }

    setItems(
      items.map((i) => (i.id === selectedItem.id ? { ...i, name: newName } : i))
    );

    setNewName("");
    setShowEditModal(false);
  };

  // ----------------------------------------------------
  // DELETE FOLDER/FILE (Recursively)
  // ----------------------------------------------------
  const deleteItem = (item) => {
    Alert.alert("Delete", `Delete "${item.name}"?`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const removeRecursively = (id, list) => {
            let updated = list.filter((i) => i.id !== id);
            list
              .filter((child) => child.parentId === id)
              .forEach((child) => {
                updated = removeRecursively(child.id, updated);
              });
            return updated;
          };
          setItems(removeRecursively(item.id, items));
        },
      },
    ]);
  };

  // ----------------------------------------------------
  // MOVE ITEM
  // ----------------------------------------------------
  const moveItem = (targetFolder) => {
    setItems(
      items.map((i) =>
        i.id === selectedItem.id ? { ...i, parentId: targetFolder } : i
      )
    );
    setShowMoveModal(false);
    setMoveFolderStack([]);
  };

  // OPEN ANY FOLDER
  const openFolder = (folder) => {
    setCurrentFolder(folder.id);
  };

  // GO BACK
  const goBack = () => {
    const parent = items.find((i) => i.id === currentFolder);
    setCurrentFolder(parent?.parentId || null);
  };

  // ----------------------------------------------------
  // MOVE MODAL HELPERS
  // ----------------------------------------------------
  const getMoveCurrentFolder = () => {
    return moveFolderStack.length ? moveFolderStack[moveFolderStack.length - 1] : null;
  };

  const getMoveBreadcrumb = () => {
    return moveFolderStack
      .map((id) => items.find((f) => f.id === id)?.name)
      .filter(Boolean)
      .join(" / ");
  };

  const getMoveList = () => {
    const current = getMoveCurrentFolder();
    return items.filter(
      (i) => i.type === "folder" && i.parentId === (current || null)
    );
  };

  const isInvalidMove = (folder) => {
    if (!selectedItem) return false;
    if (folder.id === selectedItem.id) return true;

    let parent = folder;
    while (parent) {
      if (parent.parentId === selectedItem.id) return true;
      parent = items.find((i) => i.id === parent.parentId);
    }
    return false;
  };

  // ----------------------------------------------------
  // CURRENT LIST
  // ----------------------------------------------------
  let currentList = items.filter((i) => i.parentId === currentFolder);

  if (sortType === "name") {
    currentList.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortType === "date") {
    currentList.sort((a, b) => b.created - a.created);
  } else if (sortType === "type") {
    currentList.sort((a, b) => a.type.localeCompare(b.type));
  } else if (sortType === "default") {
    currentList.sort((a, b) => a.order - b.order);
  }

  const formatDateTime = (timestamp) => {
    const d = new Date(timestamp);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const addFileFromPicker = (file) => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: file.name,
        type: "file",
        parentId: currentFolder,
        created: Date.now(),
        order: prev.length,
      }
    ]);

    setShowAddModal(false);
  };


  // ----------------------------------------------------
  // RENDER ITEM
  // ----------------------------------------------------
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => item.type === "folder" && openFolder(item)}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <MaterialIcons
          name={item.type === "folder" ? "folder" : "description"}
          size={32}
          color={item.type === "folder" ? "#1E88E5" : "#757575"}
        />

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.rowLabel}>{item.name}</Text>
          <Text style={styles.dateLabel}>{formatDateTime(item.created)}</Text>
        </View>
      </View>
<TouchableOpacity
  onPress={() => {
    setActionTarget(item);
    setShowActionMenu(true);
  }}
>
  <MaterialIcons name="more-vert" size={25} color="#000" />
</TouchableOpacity>
 
    </TouchableOpacity>
  );

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {currentFolder ? (
          <TouchableOpacity onPress={goBack}>
            <MaterialIcons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
        <Text style={styles.headerTitle}>{getBreadcrumb()}</Text>
        <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)}>
          <MaterialIcons name="more-vert" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {showSortMenu && (
        <View style={styles.sortMenu}>
          {["default", "name", "date", "type"].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.sortRow}
              onPress={() => {
                setSortType(type);
                setShowSortMenu(false);
              }}
            >
              <Text style={{ textTransform: "capitalize" }}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setNewName("");
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

{/* ACTION MENU MODAL */}
<Modal transparent visible={showActionMenu} animationType="fade">
  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "#00000055",
      justifyContent: "center",
      alignItems: "center",
    }}
    onPress={() => setShowActionMenu(false)}
    activeOpacity={1}
  >
    <View
      style={{
        width: 180,
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingVertical: 10,
        elevation: 5,
      }}
    >
      {/* EDIT — only show for folders */}
      {actionTarget?.type === "folder" && (
        <TouchableOpacity
          style={{ padding: 12 }}
          onPress={() => {
            setShowActionMenu(false);
            setSelectedItem(actionTarget);
            setNewName(actionTarget.name);
            setShowEditModal(true);
          }}
        >
          <Text>Edit</Text>
        </TouchableOpacity>
      )}

      {/* DELETE */}
      <TouchableOpacity
        style={{ padding: 12 }}
        onPress={() => {
          setShowActionMenu(false);
          deleteItem(actionTarget);
        }}
      >
        <Text>Delete</Text>
      </TouchableOpacity>

      {/* MOVE */}
      <TouchableOpacity
        style={{ padding: 12 }}
        onPress={() => {
          setShowActionMenu(false);
          setSelectedItem(actionTarget);
          setShowMoveModal(true);
        }}
      >
        <Text>Move</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>


      {/* ADD MODAL */}
      <Modal transparent visible={showAddModal} animationType="slide">
        <View style={styles.modalBody}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={newName}
              onChangeText={setNewName}
            />

            <View style={styles.rowBetween}>
              <TouchableOpacity style={styles.btn} onPress={() => addItem("folder")}>
                <Text>Folder</Text>
              </TouchableOpacity>

              <FilePickerRow
                onFilePicked={addFileFromPicker}

                isFromFileManager={true} item={undefined} handleAttachment={undefined} baseLink={undefined} infoData={undefined} />
            </View>

            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal transparent visible={showEditModal} animationType="slide">
        <View style={styles.modalBody}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename</Text>

            <TextInput style={styles.input} value={newName} onChangeText={setNewName} />

            <TouchableOpacity style={styles.btn} onPress={updateItem}>
              <Text>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.cancelBtn}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MOVE MODAL */}
      <Modal transparent visible={showMoveModal} animationType="slide">
        <View style={styles.modalBody}>
          <View style={styles.modalCardLarge}>
            <Text style={styles.modalTitle}>Move To</Text>

            {/* Breadcrumb */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
              <TouchableOpacity onPress={() => setMoveFolderStack([])}>
                <Text style={{ color: "#2196f3" }}>Documents</Text>
              </TouchableOpacity>
              {moveFolderStack.map((id, idx) => {
                const folder = items.find((f) => f.id === id);
                if (!folder) return null;
                return (
                  <Text key={id}>
                    {" / "}
                    <TouchableOpacity
                      onPress={() =>
                        setMoveFolderStack((prev) => prev.slice(0, idx + 1))
                      }
                    >
                      <Text style={{ color: "#2196f3" }}>{folder.name}</Text>
                    </TouchableOpacity>
                  </Text>
                );
              })}
            </View>

            <FlatList
              data={getMoveList()}
              keyExtractor={(f) => f.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  disabled={isInvalidMove(item)}
                  style={[styles.moveRow, { opacity: isInvalidMove(item) ? 0.4 : 1 }]}
                  onPress={() => setMoveFolderStack((prev) => [...prev, item.id])}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons name="folder" size={26} color="#1E88E5" />
                    <Text style={{ marginLeft: 10 }}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.btn, { marginTop: 10 }]}
              onPress={() => moveItem(getMoveCurrentFolder())}
            >
              <Text>Move Here</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowMoveModal(false)} style={styles.cancelBtn}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FileFolderManager;

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 2,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },

  dateLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  bottomBar: {
    padding: 15,
    alignItems: "flex-end",
  },
  addBtn: {
    backgroundColor: "#2196f3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addText: { color: "#fff", fontSize: 16 },

  modalBody: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#00000077",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalCardLarge: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    height: "70%",
  },

  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },

  btn: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: "center",
  },

  cancelBtn: {
    marginTop: 10,
    alignItems: "center",
    padding: 10,
  },

  moveRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  sortMenu: {
    position: "absolute",
    right: 14,
    top: 60,
    backgroundColor: "#fff",
    elevation: 4,
    borderRadius: 6,
    paddingVertical: 5,
    zIndex: 10,
  },

  sortRow: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
});

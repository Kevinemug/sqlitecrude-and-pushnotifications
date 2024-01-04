import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Button, FlatList, Text, TouchableOpacity, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('newmydatabase.db');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    db.transaction(
      tx => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT);',
          [],
          () => console.log('Table created successfully'),
          error => console.log('Error creating table:', error)
        );
      },
      error => console.log('Transaction error:', error),
      fetchItems
    );
  }, []);

  const fetchItems = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM items;',
        [],
        (_, { rows: { _array } }) => setItems(_array),
        error => console.log('Error fetching items: ' + error.message)
      );
    });
  };

  const handleAddOrUpdate = () => {
    if (selectedItem) {
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE items SET text = ? WHERE id = ?;',
          [inputText, selectedItem.id],
          () => {
            fetchItems();
            setInputText('');
            setSelectedItem(null);
          },
          error => console.log('Error updating item: ' + error.message)
        );
      });
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO items (text) values (?);',
          [inputText],
          () => {
            fetchItems();
            setInputText('');
            sendPushNotification(expoPushToken, `New item added: ${inputText}`);
          },
          (_, error) => console.log('SQL Error inserting item: ', error)
        );
      });
    }
  };

  const handleEdit = (item) => {
    setInputText(item.text);
    setSelectedItem(item);
  };

  const handleDelete = (id) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM items WHERE id = ?;',
        [id],
        () => fetchItems(),
        error => console.log('Error deleting item: ' + error.message)
      );
    });
  };

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    setExpoPushToken(token);
    return token;
  };

  const sendPushNotification = async (expoPushToken, body) => {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: ' From SQLite CRUD App',
      body: body,
      data: { someData: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite CRUD</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Text"
        placeholderTextColor="#666"
        value={inputText}
        onChangeText={setInputText}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddOrUpdate}>
        <Text style={styles.buttonText}>{selectedItem ? "Update" : "Add"}</Text>
      </TouchableOpacity>
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={{ color: '#fff' }}>{item.text}</Text>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={() => handleEdit(item)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleDelete(item.id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
  };

const styles = StyleSheet.create({
  container: {

    marginTop:40,
    flex: 1,
    backgroundColor: '#282c34', 
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700', 
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFD700', 
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    color: '#282c34', 
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700', 
    color: '#fff', 
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#FF4500', 
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff', 
  }
});


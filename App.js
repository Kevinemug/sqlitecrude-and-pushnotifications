import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Button, FlatList, Text, TouchableOpacity } from 'react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('newmydatabase.db');

const App = () => {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
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
          },
          (_, error) => console.log('SQL Error inserting item: ', error) // Corrected error logging
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

export default App;

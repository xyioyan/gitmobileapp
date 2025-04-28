import {
  View,
  Text,
  TouchableOpacity,
  Button,
  TextInput,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import Spinner from "react-native-loading-spinner-overlay";
import { supabase } from "@/config/initSupabase";
import { router } from "expo-router";

const Login = () => {
  const [email, setEmail] = useState("21cs055@acetcbe.edu.in");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    console.log("Sign in pressed");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log("Error signing in:", error.message);
      Alert.alert("Error signing in", error.message);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log(user?.user_metadata.name); // -> Sathish  
      Alert.alert("sign in Success");
    }
    setLoading(false);
  };
  const onSignUpPress =  () => {
    return router.replace("/signup" as never);
  };
  return (
    <View style={styles.container}>
      <Spinner visible={loading} />

      <Text style={styles.header}>My Cloud</Text>

      <TextInput
        autoCapitalize="none"
        placeholder="john@doe.com"
        value={email}
        onChangeText={setEmail}
        style={styles.inputField}
      />
      <TextInput
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.inputField}
      />

      <TouchableOpacity onPress={onSignInPress} style={styles.button}>
        <Text style={{ color: "#fff" }}>Sign in</Text>
      </TouchableOpacity>
      <Button onPress={onSignUpPress } title="Create Account" color={"#363636"} />
    </View>
  );
};
4
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
    padding: 20,
    backgroundColor: "#151515",
  },
  header: {
    fontSize: 30,
    textAlign: "center",
    margin: 50,
    color: "#fff",
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#2b825b",
    borderRadius: 4,
    padding: 10,
    color: "#fff",
    backgroundColor: "#363636",
  },
  button: {
    marginVertical: 15,
    alignItems: "center",
    backgroundColor: "#2b825b",
    padding: 12,
    borderRadius: 4,
  },
});

export default Login;

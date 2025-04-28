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
  const [name, setName] = useState("Sathish");
  const [email, setEmail] = useState("21cs055@acetcbe.edu.in");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"clerk" | "officer">("clerk");

  const onSignInPress = async () => {
    return router.replace("/");
  };
  const onSignUpPress = async () => {
    console.log("Sign up pressed");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name, role: role },
      },
    });
    if (error) {
      console.log("Error signing up:", error.message);
      Alert.alert("Error signing up", error.message);
    } else {
      Alert.alert("sign up Success");
    }
    setLoading(false);
  };
  return (
    <View style={styles.container}>
      <Spinner visible={loading} />

      <Text style={styles.header}>My Cloud</Text>

      <TextInput
        autoCapitalize="none"
        placeholder="John"
        value={name}
        onChangeText={setName}
        style={styles.inputField}
      />
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

      <Text style={styles.roleLabel}>Select Role:</Text>

      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setRole("clerk")}
        >
          <View
            style={[
              styles.radioCircle,
              role === "clerk" && styles.selectedRadio,
            ]}
          />
          <Text style={styles.radioText}>User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setRole("officer")}
        >
          <View
            style={[
              styles.radioCircle,
              role === "officer" && styles.selectedRadio,
            ]}
          />
          <Text style={styles.radioText}>Admin</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onSignUpPress} style={styles.button}>
        <Text style={{ color: "#fff" }}>Sign Up</Text>
      </TouchableOpacity>
      <Button
        onPress={onSignInPress}
        title="Already have an Account"
        color={"#363636"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 150,
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
  
  roleLabel: {
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2b825b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  selectedRadio: {
    backgroundColor: "#2b825b",
  },
  radioText: {
    color: "#fff",
  },
});

export default Login;

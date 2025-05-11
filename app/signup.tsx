import {
  View,
  Text,
  TouchableOpacity,
  Button,
  TextInput,
  Alert,
  KeyboardAvoidingView, 
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Spinner from "react-native-loading-spinner-overlay";
import { supabase } from "@/config/initSupabase";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
// import { KeyboardAvoidingView  } from "react-native-reanimated/lib/typescript/Animated";

interface Officer {
  id: string;
  name: string;
}
const SignIn = () => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("Sathish");
  const [email, setEmail] = useState("21cs055@acetcbe.edu.in");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [fetchingOfficers, setFetchingOfficers] = useState(true); // For officers dropdown
  const [role, setRole] = useState<"clerk" | "officer">("officer");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [officerItems, setOfficerItems] = useState<
    { label: string; value: string }[]
  >([]);

  const fetchOfficers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "officer");

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setOfficers(data || []);
      setOfficerItems(
        (data || []).map((o) => ({ label: o.name, value: o.id }))
      );
    }
    // console.log(data);
    setFetchingOfficers(false);
  };

  const onSignInPress = async () => {
    return router.replace("/");
  };
  const onSignUpPress = async () => {
    setLoading(true);
  
    if (!email || !password || !name) {
      Alert.alert("Please enter your name, email and password.");
      setLoading(false);
      return;
    }
  
    if (role === "clerk" && !selectedOfficer) {
      Alert.alert("Please select an officer.");
      setLoading(false);
      return;
    }
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          officer: role === "clerk" ? selectedOfficer : null,
        },
      },
    });
  
    setLoading(false);
  
    if (error) {
      Alert.alert("Error signing up", error.message);
      return;
    }
  
    Alert.alert(
      "Success",
      "Sign-up successful. Please check your email to verify your account."
    );
    router.replace("/");
  };
  
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ flex: 1, backgroundColor: "#151515" }}>
      <View style={[styles.container,{paddingBottom: insets.bottom + 16}]}>
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
            onPress={() => {
              setRole("clerk");
              fetchOfficers();
            }}
          >
            <View
              style={[
                styles.radioCircle,
                role === "clerk" && styles.selectedRadio,
              ]}
            />
            <Text style={styles.radioText}>Clerk</Text>
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
            <Text style={styles.radioText}>Officer</Text>
          </TouchableOpacity>
        </View>
        {role === "clerk" && (
          <View style={{ zIndex: 1000, marginBottom: 20 }}>
            <Text style={styles.label}>Select Your Officer</Text>
            {fetchingOfficers ? (
              <Text style={{ color: "#fff" }}>Loading officers...</Text>
            ) : (
              <DropDownPicker
                open={dropdownOpen}
                value={selectedOfficer}
                items={officerItems}
                setOpen={setDropdownOpen}
                setValue={setSelectedOfficer}
                setItems={setOfficerItems}
                placeholder="Choose an officer..."
                style={{
                  backgroundColor: "#363636",
                  borderColor: "#2b825b",
                }}
                dropDownContainerStyle={{
                  backgroundColor: "#363636",
                  borderColor: "#2b825b",
                }}
                textStyle={{ color: "#fff" }}
                placeholderStyle={{ color: "#888" }}
                listItemLabelStyle={{ color: "#fff" }}
              />
            )}
          </View>
        )}

        <TouchableOpacity onPress={onSignUpPress} style={styles.button}>
          <Text style={{ color: "#fff" }}>Sign Up</Text>
        </TouchableOpacity>
        <Button
          onPress={onSignInPress}
          title="Already have an Account"
          color={"#363636"}
        />
      </View>
    </KeyboardAvoidingView >
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 150,
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
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
    color: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
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

export default SignIn;

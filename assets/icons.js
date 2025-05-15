import { AntDesign, Feather } from "@expo/vector-icons";

export const icons = {
    cdashboard: (props)=> <AntDesign name="home" size={26} {...props} />,
    // list: (props)=> <Feather name="checksquareo" size={26} {...props} />,
    list: (props) => <Feather name="check-square" size={26} {...props} />,
    visits: (props)=> <AntDesign name="clockcircleo" size={26} {...props} />,
    profile: (props)=> <AntDesign name="user" size={26} {...props} />,
}
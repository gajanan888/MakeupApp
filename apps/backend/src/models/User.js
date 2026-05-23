import { DataTypes } from "sequelize";
import sequelize from "../config/db";

const User= sequelize.define("User",{
    name:{
        type: DataTypes.STRING,
    },
    email:{
        type: DataTypes.STRING,
        unique: true,
    },
    phone:{
        type: DataTypes.STRING,
    },
    role:{
        type: DataType.ENUM("user","artist","admin"),
        defaultValue:"user",
    },
})

export default User;
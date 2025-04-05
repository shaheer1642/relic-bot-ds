import { useContext } from "react";
import { AuthContext, IAuthContext } from "../contexts/AuthContext";

export const useAuth = (): IAuthContext => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
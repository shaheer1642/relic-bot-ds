import { useContext } from "react";
import { StoreContext, IStoreContext } from "../contexts/StoreContext";

export const useStore = (): IStoreContext => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useStore must be used within an StoreProvider");
    }
    return context;
};
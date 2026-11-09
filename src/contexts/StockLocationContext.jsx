import { createContext, useContext, useState } from "react";
import { useStockLocations } from "../hooks/useStockLocations";

const StockLocationContext = createContext(null);

export const useStockLocation = () => {
    const ctx = useContext(StockLocationContext);
    if (!ctx) throw new Error("useStockLocation must be used within StockLocationProvider");
    return ctx;
};

export const StockLocationProvider = ({ children }) => {
    const { stockLocations, loading } = useStockLocations();

    const [selectedLocation, setSelectedLocationState] = useState(() => {
        try {
            const stored = sessionStorage.getItem("stock_location");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const setSelectedLocation = (location) => {
        setSelectedLocationState(location);
        if (location) {
            sessionStorage.setItem("stock_location", JSON.stringify(location));
        } else {
            sessionStorage.removeItem("stock_location");
        }
    };

    return (
        <StockLocationContext.Provider value={{ selectedLocation, setSelectedLocation, stockLocations, loading }}>
            {children}
        </StockLocationContext.Provider>
    );
};

export default StockLocationContext;

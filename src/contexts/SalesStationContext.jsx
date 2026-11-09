import { createContext, useContext, useState } from "react";
import { useSalesStations } from "../hooks/useSalesStations";

const SalesStationContext = createContext(null);

export const useSalesStation = () => {
    const ctx = useContext(SalesStationContext);
    if (!ctx) throw new Error("useSalesStation must be used within SalesStationProvider");
    return ctx;
};

export const SalesStationProvider = ({ children }) => {
    const { salesStations, loading } = useSalesStations();

    const [selectedStation, setSelectedStationState] = useState(() => {
        try {
            const stored = sessionStorage.getItem("sales_station");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const setSelectedStation = (station) => {
        setSelectedStationState(station);
        if (station) {
            sessionStorage.setItem("sales_station", JSON.stringify(station));
        } else {
            sessionStorage.removeItem("sales_station");
        }
    };

    return (
        <SalesStationContext.Provider value={{ selectedStation, setSelectedStation, salesStations, loading }}>
            {children}
        </SalesStationContext.Provider>
    );
};

export default SalesStationContext;

import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export function useProductionStations() {
    const [ProductionStations, setProductionStations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        if (!userId) return;

        setLoading(true);
        apiClient
            .get(`/IAmAPI/api/users/${userId}/organisational-units?is_production_unit=true`)
            .then(res => setProductionStations(res.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { ProductionStations, loading };
}

import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export function useStockLocations() {
    const [stockLocations, setStockLocations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        if (!userId) return;

        setLoading(true);
        apiClient
            .get(`/IAmAPI/api/users/${userId}/organisational-units?is_stock_location=true`)
            .then(res => setStockLocations(res.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { stockLocations, loading };
}

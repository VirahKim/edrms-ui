import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export function useSalesStations() {
    const [salesStations, setSalesStations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.user_id;
        if (!userId) return;

        setLoading(true);
        apiClient
            .get(`/IAmAPI/api/users/${userId}/organisational-units?is_sales_point=true`)
            .then(res => setSalesStations(res.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { salesStations, loading };
}

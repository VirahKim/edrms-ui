import React from "react";

const MONTHS = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
];

export const getMonthLabel = (value) =>
    MONTHS.find(m => m.value === String(value))?.label || String(value);

const MonthSelect = ({ name, value, onChange, className = "form-select" }) => (
    <select name={name} value={value} onChange={onChange} className={className}>
        {MONTHS.map(month => (
            <option key={month.value} value={month.value}>{month.label}</option>
        ))}
    </select>
);

export default MonthSelect;

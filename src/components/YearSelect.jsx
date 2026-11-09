import React from "react";

const currentYear = new Date().getFullYear();

const YearSelect = ({
    name,
    value,
    onChange,
    className = "form-select",
    startYear = 2000,
    endYear = currentYear + 2
}) => {
    const years = [];
    for (let y = endYear; y >= startYear; y--) {
        years.push(y);
    }

    return (
        <select name={name} value={value} onChange={onChange} className={className}>
            {years.map(year => (
                <option key={year} value={year}>{year}</option>
            ))}
        </select>
    );
};

export default YearSelect;

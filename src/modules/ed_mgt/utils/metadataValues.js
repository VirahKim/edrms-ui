// Builds the values[] array saveMetadataValues expects from a { field_code: value } map,
// keyed off each field's field_type so the right value_* column gets populated.
export const buildMetadataValues = (metaValues, typeFields) =>
  Object.entries(metaValues)
    .filter(([, val]) => val !== undefined && val !== null && val !== "")
    .map(([code, val]) => {
      const field = typeFields.find((f) => f.field_code === code);
      const entry = { field_code: code, field_id: field?.id };
      switch (field?.field_type) {
        case "DATE":
        case "DATETIME": entry.value_date = val; break;
        case "NUMBER":   entry.value_number = Number(val); break;
        case "BOOLEAN":  entry.value_boolean = val; break;
        default:         entry.value_text = val;
      }
      return entry;
    });

// Badge colour and filter order for the file routing stages.
export const STAGE_BADGE = {
  MARKING: "text-bg-primary",
  RETURNED_FROM_MARKING: "text-bg-warning",
  ACTION: "text-bg-info",
  RETURNED_FROM_ACTION: "text-bg-warning",
  FILED_AWAY: "text-bg-success",
};

export const STAGE_FILTERS = [
  { key: "ACTIVE", label: "All active" },
  { key: "MARKING", label: "With Marking Officer" },
  { key: "RETURNED_FROM_MARKING", label: "Returned from marking" },
  { key: "ACTION", label: "With Action Officer" },
  { key: "RETURNED_FROM_ACTION", label: "Returned from action" },
  { key: "FILED_AWAY", label: "Filed away" },
];

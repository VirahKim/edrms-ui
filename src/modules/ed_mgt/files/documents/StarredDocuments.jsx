import React from "react";
import RecentDocuments from "./RecentDocuments";

// Same sortable/paginated list as Recent, filtered to starred documents only
// — see RecentDocuments' `mode` prop for how starring behaves differently here
// (unstarring drops the row immediately, since this list IS the star filter).
const StarredDocuments = () => <RecentDocuments mode="starred" />;

export default StarredDocuments;

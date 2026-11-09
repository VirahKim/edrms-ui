import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingApprovals } from "../api/workflowsApi";
import { getUnreadNotificationsCount, getRecentNotifications, markNotificationRead } from "../api/notificationsApi";
import { getUnreadMessagesCount, getRecentConversations } from "../api/messagesApi";
import { logout } from "../api/apiClient";
import ChangePasswordModal from "../modules/identity_n_authentication/auth/ChangePasswordModal";

const notifRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const Navbar = ({ menus = [] }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const rawName = user?.full_name || "...";
    const nameParts = rawName.trim().split(/\s+/);
    const fullName =
        nameParts.length > 1
            ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
            : nameParts[0];
    const organizationName = user?.organization_name || null;
    const role = user?.roles?.length > 0 ? user.roles[0].role_name : "User";

    const [showTheme, setShowTheme] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIdx, setHighlightedIdx] = useState(0);
    // Reset the highlight whenever the query changes — adjusted directly during
    // render (React's recommended pattern for derived state) rather than via a
    // useEffect, which would cause an extra render/commit cycle.
    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
    if (searchQuery !== prevSearchQuery) {
        setPrevSearchQuery(searchQuery);
        setHighlightedIdx(0);
    }

    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [showNotifPreview, setShowNotifPreview] = useState(false);
    const [notifPreview, setNotifPreview] = useState([]);
    const [notifPreviewLoading, setNotifPreviewLoading] = useState(false);

    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [showMessagesPreview, setShowMessagesPreview] = useState(false);
    const [messagesPreview, setMessagesPreview] = useState([]);
    const [messagesPreviewLoading, setMessagesPreviewLoading] = useState(false);

    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Build a flat, searchable index from role-scoped menus only. Modules can
    // nest to any depth (module -> sub-module -> sub-sub-module -> ...); only
    // leaf nodes are navigable pages, so only leaves are indexed.
    const buildSearchIndex = () => {
        const items = [];
        const walk = (node, breadcrumb) => {
            const trail = breadcrumb ? `${breadcrumb} › ${node.label}` : node.label;
            if (node.sub_modules && node.sub_modules.length > 0) {
                node.sub_modules.forEach((child) => walk(child, trail));
            } else if (node.path) {
                items.push({ label: node.label, path: node.path, breadcrumb: trail });
            }
        };
        menus.forEach((menu) => walk(menu, ""));
        return items;
    };

    const searchResults = searchQuery.trim()
        ? buildSearchIndex()
            .filter((item) =>
                item.breadcrumb.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 8)
        : [];

    const toggleTheme = () => {
        setShowTheme(!showTheme);
        setShowProfile(false);
    };

    const toggleProfile = () => {
        setShowProfile(!showProfile);
        setShowTheme(false);
    };

    const closeAll = () => {
        setShowTheme(false);
        setShowProfile(false);
    };

    const setTheme = (theme) => {
        document.body.setAttribute("data-pc-theme", theme);
        // Kept in sync with data-pc-theme — see main.jsx for why both are needed.
        document.body.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);
    };

    const openSearch = () => {
        setShowSearch(true);
        setSearchQuery("");
        setHighlightedIdx(0);
    };

    const closeSearch = () => {
        setShowSearch(false);
        setSearchQuery("");
        setHighlightedIdx(0);
    };

    const handleResultClick = (path) => {
        navigate(path);
        closeSearch();
    };

    // Ctrl+K / Cmd+K global shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                openSearch();
            }
            if (e.key === "Escape" && showSearch) {
                closeSearch();
            }
            if (showSearch) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIdx((i) => Math.min(i + 1, searchResults.length - 1));
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIdx((i) => Math.max(i - 1, 0));
                }
                if (e.key === "Enter" && searchResults[highlightedIdx]) {
                    handleResultClick(searchResults[highlightedIdx].path);
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showSearch, searchResults, highlightedIdx]);

    // Focus input when search opens
    useEffect(() => {
        if (showSearch) {
            setTimeout(() => searchInputRef.current?.focus(), 30);
        }
    }, [showSearch]);

    // Pending approvals count — poll so the badge stays fresh
    useEffect(() => {
        let cancelled = false;
        const loadPendingApprovals = async () => {
            try {
                const res = await getPendingApprovals({ page: 1, page_size: 1 });
                if (!cancelled) setPendingApprovalsCount(res?.total_count ?? 0);
            } catch {
                // silently ignore — badge just won't update this cycle
            }
        };
        loadPendingApprovals();
        const id = setInterval(loadPendingApprovals, 60_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    // Unread notifications count — poll so the bell badge stays fresh
    useEffect(() => {
        let cancelled = false;
        const loadUnreadNotifications = async () => {
            try {
                const count = await getUnreadNotificationsCount();
                if (!cancelled) setUnreadNotificationsCount(count);
            } catch {
                // silently ignore — badge just won't update this cycle
            }
        };
        loadUnreadNotifications();
        const id = setInterval(loadUnreadNotifications, 60_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    const openNotifPreview = () => {
        setShowNotifPreview(true);
        setNotifPreviewLoading(true);
        getRecentNotifications(6)
            .then(({ items, unreadCount }) => {
                setNotifPreview(items);
                setUnreadNotificationsCount(unreadCount);
            })
            .catch(() => {})
            .finally(() => setNotifPreviewLoading(false));
    };

    const handleNotifPreviewClick = (notification) => {
        setShowNotifPreview(false);
        if (!notification.is_read) {
            setUnreadNotificationsCount((n) => Math.max(0, n - 1));
            markNotificationRead(notification.id).catch(() => {});
        }
        navigate("/communication/notifications/inbox", { state: { openNotificationId: notification.id } });
    };

    // Unread messages count — poll so the bell badge stays fresh
    useEffect(() => {
        let cancelled = false;
        const loadUnreadMessages = async () => {
            try {
                const count = await getUnreadMessagesCount();
                if (!cancelled) setUnreadMessagesCount(count);
            } catch {
                // silently ignore — badge just won't update this cycle
            }
        };
        loadUnreadMessages();
        const id = setInterval(loadUnreadMessages, 60_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    const openMessagesPreview = () => {
        setShowMessagesPreview(true);
        setMessagesPreviewLoading(true);
        getRecentConversations(6)
            .then(({ items, unreadCount }) => {
                setMessagesPreview(items);
                setUnreadMessagesCount(unreadCount);
            })
            .catch(() => {})
            .finally(() => setMessagesPreviewLoading(false));
    };

    const handleMessagePreviewClick = (conversation) => {
        setShowMessagesPreview(false);
        // Opening the conversation is what marks it read server-side (see
        // ChatWindow's initial fetch) — this just clears the badge locally
        // so it doesn't wait for the next poll cycle.
        setUnreadMessagesCount((n) => Math.max(0, n - (conversation.unread_count || 0)));
        navigate("/communication/messages/inbox", { state: { openConversationId: conversation.id } });
    };

    // Close when clicking outside
    useEffect(() => {
        if (!showSearch) return;
        const handleClickOutside = (e) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target)
            ) {
                closeSearch();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showSearch]);

    return (
        <>
            <div onClick={closeAll} className="dropdown-backdrop" />

            <header className="pc-header">
                <div className="header-wrapper">

                    <div className="ms-auto">
                        <ul className="list-unstyled">

                            {/* GLOBAL SEARCH */}
                            <li
                                className="pc-h-item"
                                style={{ position: "relative" }}
                                ref={searchContainerRef}
                            >
                                <a
                                    className="pc-head-link me-0"
                                    style={{ cursor: "pointer" }}
                                    title="Search navigation (Ctrl+K)"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        showSearch ? closeSearch() : openSearch();
                                    }}
                                >
                                    <i className="ti ti-search" style={{ fontSize: "18px" }} />
                                </a>

                                {showSearch && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 10px)",
                                            right: 0,
                                            width: "360px",
                                            background: "var(--bs-card-bg, #fff)",
                                            border: "1px solid var(--bs-border-color, #dde3ea)",
                                            borderRadius: "10px",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.13)",
                                            zIndex: 1055,
                                            overflow: "hidden",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Search input */}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "10px 12px",
                                                borderBottom: "1px solid var(--bs-border-color, #eef0f4)",
                                                gap: "8px",
                                            }}
                                        >
                                            <i
                                                className="ti ti-search"
                                                style={{ fontSize: "15px", opacity: 0.45, flexShrink: 0 }}
                                            />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                className="form-control border-0 shadow-none p-0"
                                                placeholder="Search navigation..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{ fontSize: "14px", background: "transparent" }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: "11px",
                                                    color: "var(--bs-secondary-color, #8f9caa)",
                                                    background: "var(--bs-light, #f0f4f8)",
                                                    border: "1px solid var(--bs-border-color, #dde3ea)",
                                                    borderRadius: "4px",
                                                    padding: "2px 6px",
                                                    flexShrink: 0,
                                                    cursor: "pointer",
                                                }}
                                                onClick={closeSearch}
                                                title="Close"
                                            >
                                                ESC
                                            </span>
                                        </div>

                                        {/* Results */}
                                        <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                                            {!searchQuery.trim() ? (
                                                <div
                                                    style={{
                                                        padding: "24px 16px",
                                                        textAlign: "center",
                                                        color: "var(--bs-secondary-color, #8f9caa)",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    <i
                                                        className="ti ti-search"
                                                        style={{
                                                            fontSize: "26px",
                                                            display: "block",
                                                            marginBottom: "8px",
                                                            opacity: 0.35,
                                                        }}
                                                    />
                                                    Type to search your accessible pages
                                                    <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.7 }}>
                                                        Use ↑↓ to navigate, Enter to go
                                                    </div>
                                                </div>
                                            ) : searchResults.length === 0 ? (
                                                <div
                                                    style={{
                                                        padding: "24px 16px",
                                                        textAlign: "center",
                                                        color: "var(--bs-secondary-color, #8f9caa)",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    No results for "<strong>{searchQuery}</strong>"
                                                </div>
                                            ) : (
                                                searchResults.map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px",
                                                            padding: "10px 14px",
                                                            width: "100%",
                                                            background:
                                                                idx === highlightedIdx
                                                                    ? "var(--bs-primary-bg-subtle, #e8edff)"
                                                                    : "transparent",
                                                            border: "none",
                                                            borderBottom:
                                                                idx < searchResults.length - 1
                                                                    ? "1px solid var(--bs-border-color, #f4f5f7)"
                                                                    : "none",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                            transition: "background 0.1s",
                                                        }}
                                                        onMouseEnter={() => setHighlightedIdx(idx)}
                                                        onClick={() => handleResultClick(item.path)}
                                                    >
                                                        <span
                                                            style={{
                                                                width: "30px",
                                                                height: "30px",
                                                                borderRadius: "6px",
                                                                background: "var(--bs-primary-bg-subtle, #e8edff)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <i
                                                                className="ti ti-layout-sidebar"
                                                                style={{
                                                                    fontSize: "14px",
                                                                    color: "var(--bs-primary, #4680ff)",
                                                                }}
                                                            />
                                                        </span>
                                                        <span style={{ flex: 1, minWidth: 0 }}>
                                                            <span
                                                                style={{
                                                                    fontSize: "13px",
                                                                    fontWeight: 500,
                                                                    display: "block",
                                                                    color: "var(--bs-body-color, #1d2630)",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {item.label}
                                                            </span>
                                                            {item.breadcrumb !== item.label && (
                                                                <span
                                                                    style={{
                                                                        fontSize: "11px",
                                                                        color: "var(--bs-secondary-color, #8f9caa)",
                                                                        whiteSpace: "nowrap",
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        display: "block",
                                                                    }}
                                                                >
                                                                    {item.breadcrumb}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <i
                                                            className="ti ti-corner-down-left"
                                                            style={{
                                                                fontSize: "13px",
                                                                opacity: idx === highlightedIdx ? 0.6 : 0,
                                                                flexShrink: 0,
                                                                color: "var(--bs-primary, #4680ff)",
                                                            }}
                                                        />
                                                    </button>
                                                ))
                                            )}
                                        </div>

                                        {searchResults.length > 0 && (
                                            <div
                                                style={{
                                                    padding: "6px 14px",
                                                    borderTop: "1px solid var(--bs-border-color, #eef0f4)",
                                                    fontSize: "11px",
                                                    color: "var(--bs-secondary-color, #8f9caa)",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <span>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</span>
                                                <span>↑↓ navigate · Enter to open</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>

                            {/* THEME TOGGLE */}
                            <li className="pc-h-item" style={{ position: "relative" }}>
                                <a
                                    className="pc-head-link me-0"
                                    style={{ cursor: "pointer" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTheme();
                                    }}
                                >
                                    <svg className="pc-icon">
                                        <use xlinkHref="#custom-sun-1" />
                                    </svg>
                                </a>

                                {showTheme && (
                                    <div className="dropdown-menu dropdown-menu-end pc-h-dropdown show">
                                        <a
                                            className="dropdown-item"
                                            onClick={() => setTheme("dark")}
                                        >
                                            <svg className="pc-icon">
                                                <use xlinkHref="#custom-moon" />
                                            </svg>
                                            <span>Dark</span>
                                        </a>
                                        <a
                                            className="dropdown-item"
                                            onClick={() => setTheme("light")}
                                        >
                                            <svg className="pc-icon">
                                                <use xlinkHref="#custom-sun-1" />
                                            </svg>
                                            <span>Light</span>
                                        </a>
                                    </div>
                                )}
                            </li>

                            {/* QBITS AI ASSISTANT */}
                            <li className="pc-h-item d-flex align-items-center">
                                <a
                                    className="d-flex align-items-center gap-1 me-0"
                                    style={{
                                        cursor: "pointer",
                                        background: "linear-gradient(135deg, #007bff, #3395ff)",
                                        color: "#fff",
                                        borderRadius: "999px",
                                        padding: "6px 12px",
                                    }}
                                    title="Qbits — your ERP assistant"
                                    onClick={() => navigate("/ai-assistant/chat")}
                                >
                                    <i className="ti ti-sparkles" style={{ fontSize: "16px" }} />
                                    <span className="d-none d-sm-inline fw-semibold" style={{ fontSize: "12.5px" }}>
                                        AI
                                    </span>
                                </a>
                            </li>

                            {/* PENDING APPROVALS */}
                            <li className="pc-h-item">
                                <a
                                    className="pc-head-link me-0"
                                    style={{ cursor: "pointer", position: "relative" }}
                                    onClick={() => navigate("/workflows/approvals/pending")}
                                    title={
                                        pendingApprovalsCount > 0
                                            ? `${pendingApprovalsCount} pending approval${pendingApprovalsCount !== 1 ? "s" : ""}`
                                            : "Pending Approvals"
                                    }
                                >
                                    <i className="ti ti-list-check" style={{ fontSize: "20px" }} />
                                    {pendingApprovalsCount > 0 && (
                                        <span
                                            className="badge rounded-pill bg-danger"
                                            style={{
                                                position: "absolute",
                                                top: "3px",
                                                right: "3px",
                                                fontSize: "9px",
                                                lineHeight: 1,
                                                padding: "3px 5px",
                                                minWidth: "16px",
                                                zIndex: 9,
                                                boxShadow: "0 0 0 2px var(--pc-header-background, #fff)",
                                            }}
                                        >
                                            {pendingApprovalsCount > 99 ? "99+" : pendingApprovalsCount}
                                        </span>
                                    )}
                                </a>
                            </li>

                            {/* MESSAGES */}
                            <li
                                className="pc-h-item"
                                style={{ position: "relative" }}
                                onMouseEnter={openMessagesPreview}
                                onMouseLeave={() => setShowMessagesPreview(false)}
                            >
                                <a
                                    className="pc-head-link me-0"
                                    style={{ cursor: "pointer", position: "relative" }}
                                    title={
                                        unreadMessagesCount > 0
                                            ? `${unreadMessagesCount} unread message${unreadMessagesCount !== 1 ? "s" : ""}`
                                            : "Messages"
                                    }
                                    onClick={() => navigate("/communication/messages/inbox")}
                                >
                                    <i className="ti ti-mail" style={{ fontSize: "20px" }} />
                                    {unreadMessagesCount > 0 && (
                                        <span
                                            className="badge rounded-pill bg-danger"
                                            style={{
                                                position: "absolute",
                                                top: "3px",
                                                right: "3px",
                                                fontSize: "9px",
                                                lineHeight: 1,
                                                padding: "3px 5px",
                                                minWidth: "16px",
                                                zIndex: 9,
                                                boxShadow: "0 0 0 2px var(--pc-header-background, #fff)",
                                            }}
                                        >
                                            {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                                        </span>
                                    )}
                                </a>

                                {showMessagesPreview && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 10px)",
                                            right: 0,
                                            width: "340px",
                                            background: "var(--bs-card-bg, #fff)",
                                            border: "1px solid var(--bs-border-color, #dde3ea)",
                                            borderRadius: "10px",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.13)",
                                            zIndex: 1055,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "10px 14px",
                                                borderBottom: "1px solid var(--bs-border-color, #eef0f4)",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Messages
                                            {unreadMessagesCount > 0 && (
                                                <span className="badge rounded-pill bg-primary" style={{ fontSize: "10px" }}>
                                                    {unreadMessagesCount} unread
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                                            {messagesPreviewLoading ? (
                                                <div style={{ padding: "24px", textAlign: "center" }}>
                                                    <span className="spinner-border spinner-border-sm text-primary" />
                                                </div>
                                            ) : messagesPreview.length === 0 ? (
                                                <div
                                                    style={{
                                                        padding: "24px 16px",
                                                        textAlign: "center",
                                                        color: "var(--bs-secondary-color, #8f9caa)",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    <i
                                                        className="ti ti-mail-off"
                                                        style={{ fontSize: "24px", display: "block", marginBottom: "6px", opacity: 0.35 }}
                                                    />
                                                    Your inbox is empty
                                                </div>
                                            ) : (
                                                messagesPreview.map((c, idx) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "flex-start",
                                                            gap: "10px",
                                                            width: "100%",
                                                            padding: "10px 14px",
                                                            background: c.unread_count > 0 ? "rgba(13,110,253,0.04)" : "transparent",
                                                            border: "none",
                                                            borderBottom:
                                                                idx < messagesPreview.length - 1
                                                                    ? "1px solid var(--bs-border-color, #f4f5f7)"
                                                                    : "none",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                        }}
                                                        onClick={() => handleMessagePreviewClick(c)}
                                                    >
                                                        {c.unread_count > 0 && (
                                                            <span
                                                                className="rounded-circle bg-primary flex-shrink-0"
                                                                style={{ width: 8, height: 8, marginTop: 5 }}
                                                                title="Unread"
                                                            />
                                                        )}
                                                        <span style={{ flex: 1, minWidth: 0 }}>
                                                            <span
                                                                style={{
                                                                    fontSize: "13px",
                                                                    fontWeight: c.unread_count > 0 ? 600 : 500,
                                                                    display: "block",
                                                                    color: "var(--bs-body-color, #1d2630)",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {c.other_user_name || `User #${c.other_user_id}`}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: "11px",
                                                                    color: "var(--bs-secondary-color, #8f9caa)",
                                                                    display: "block",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {c.last_message_preview || c.topic || "No messages yet"} &middot; {notifRelativeTime(c.last_message_at)}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                padding: "8px 14px",
                                                borderTop: "1px solid var(--bs-border-color, #eef0f4)",
                                                textAlign: "center",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link p-0"
                                                style={{ fontSize: "12px" }}
                                                onClick={() => { setShowMessagesPreview(false); navigate("/communication/messages/inbox"); }}
                                            >
                                                View all messages
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>

                            {/* NOTIFICATIONS */}
                            <li
                                className="pc-h-item"
                                style={{ position: "relative" }}
                                onMouseEnter={openNotifPreview}
                                onMouseLeave={() => setShowNotifPreview(false)}
                            >
                                <a
                                    className="pc-head-link me-0"
                                    style={{ cursor: "pointer", position: "relative" }}
                                    title={
                                        unreadNotificationsCount > 0
                                            ? `${unreadNotificationsCount} unread notification${unreadNotificationsCount !== 1 ? "s" : ""}`
                                            : "Notifications"
                                    }
                                    onClick={() => navigate("/communication/notifications/inbox")}
                                >
                                    <svg className="pc-icon">
                                        <use xlinkHref="#custom-notification" />
                                    </svg>
                                    {unreadNotificationsCount > 0 && (
                                        <span
                                            className="badge rounded-pill bg-danger"
                                            style={{
                                                position: "absolute",
                                                top: "3px",
                                                right: "3px",
                                                fontSize: "9px",
                                                lineHeight: 1,
                                                padding: "3px 5px",
                                                minWidth: "16px",
                                                zIndex: 9,
                                                boxShadow: "0 0 0 2px var(--pc-header-background, #fff)",
                                            }}
                                        >
                                            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                                        </span>
                                    )}
                                </a>

                                {showNotifPreview && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 10px)",
                                            right: 0,
                                            width: "340px",
                                            background: "var(--bs-card-bg, #fff)",
                                            border: "1px solid var(--bs-border-color, #dde3ea)",
                                            borderRadius: "10px",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.13)",
                                            zIndex: 1055,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "10px 14px",
                                                borderBottom: "1px solid var(--bs-border-color, #eef0f4)",
                                                fontSize: "13px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Notifications
                                            {unreadNotificationsCount > 0 && (
                                                <span className="badge rounded-pill bg-primary" style={{ fontSize: "10px" }}>
                                                    {unreadNotificationsCount} unread
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                                            {notifPreviewLoading ? (
                                                <div style={{ padding: "24px", textAlign: "center" }}>
                                                    <span className="spinner-border spinner-border-sm text-primary" />
                                                </div>
                                            ) : notifPreview.length === 0 ? (
                                                <div
                                                    style={{
                                                        padding: "24px 16px",
                                                        textAlign: "center",
                                                        color: "var(--bs-secondary-color, #8f9caa)",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    <i
                                                        className="ti ti-bell-off"
                                                        style={{ fontSize: "24px", display: "block", marginBottom: "6px", opacity: 0.35 }}
                                                    />
                                                    Your inbox is empty
                                                </div>
                                            ) : (
                                                notifPreview.map((n, idx) => (
                                                    <button
                                                        key={n.id}
                                                        type="button"
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "flex-start",
                                                            gap: "10px",
                                                            width: "100%",
                                                            padding: "10px 14px",
                                                            background: !n.is_read ? "rgba(13,110,253,0.04)" : "transparent",
                                                            border: "none",
                                                            borderBottom:
                                                                idx < notifPreview.length - 1
                                                                    ? "1px solid var(--bs-border-color, #f4f5f7)"
                                                                    : "none",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                        }}
                                                        onClick={() => handleNotifPreviewClick(n)}
                                                    >
                                                        {!n.is_read && (
                                                            <span
                                                                className="rounded-circle bg-primary flex-shrink-0"
                                                                style={{ width: 8, height: 8, marginTop: 5 }}
                                                                title="Unread"
                                                            />
                                                        )}
                                                        <span style={{ flex: 1, minWidth: 0 }}>
                                                            <span
                                                                style={{
                                                                    fontSize: "13px",
                                                                    fontWeight: !n.is_read ? 600 : 500,
                                                                    display: "block",
                                                                    color: "var(--bs-body-color, #1d2630)",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                }}
                                                            >
                                                                {n.subject || "(no subject)"}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: "11px",
                                                                    color: "var(--bs-secondary-color, #8f9caa)",
                                                                }}
                                                            >
                                                                {n.channel_name} &middot; {notifRelativeTime(n.sent_at || n.created_at)}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                padding: "8px 14px",
                                                borderTop: "1px solid var(--bs-border-color, #eef0f4)",
                                                textAlign: "center",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link p-0"
                                                style={{ fontSize: "12px" }}
                                                onClick={() => { setShowNotifPreview(false); navigate("/communication/notifications/inbox"); }}
                                            >
                                                View all notifications
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>

                            {/* PROFILE */}
                            <li
                                className="pc-h-item header-user-profile"
                                style={{ position: "relative" }}
                            >
                                <a
                                    className="pc-head-link me-0 d-flex align-items-center"
                                    style={{ cursor: "pointer", gap: "8px" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleProfile();
                                    }}
                                >
                                    <img
                                        src="/assets/images/user/avatar-2.jpg"
                                        alt="profile"
                                        className="user-avtar"
                                    />
                                </a>

                                {showProfile && (
                                    <div className="dropdown-menu dropdown-user-profile dropdown-menu-end pc-h-dropdown show">
                                        <div className="dropdown-body">
                                            <div className="d-flex mb-1">
                                                <img
                                                    src="/assets/images/user/avatar-2.jpg"
                                                    alt="user"
                                                    className="user-avtar"
                                                />
                                                <div className="ms-3">
                                                    <h6 className="mb-1">{fullName}</h6>
                                                    <span className="text-muted d-block mb-1">
                                                        {role}
                                                    </span>
                                                    {/* <span className="text-muted d-block">
                                                        {emailAddress}
                                                    </span> */}
                                                    {organizationName && (
                                                        <span
                                                            style={{
                                                                fontSize: "11px",
                                                                color: "var(--bs-primary, #4680ff)",
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            <i
                                                                className="ti ti-building me-1"
                                                                style={{ fontSize: "11px" }}
                                                            />
                                                            {organizationName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <hr />

                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    navigate("/my-profile");
                                                    setShowProfile(false);
                                                }}
                                            >
                                                <svg className="pc-icon me-2">
                                                    <use xlinkHref="#custom-user" />
                                                </svg>
                                                My Profile
                                            </button>

                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setShowChangePassword(true);
                                                    setShowProfile(false);
                                                }}
                                            >
                                                <svg className="pc-icon me-2">
                                                    <use xlinkHref="#custom-setting-outline" />
                                                </svg>
                                                Change Password
                                            </button>

                                            <button className="dropdown-item" onClick={logout}>
                                                <svg className="pc-icon me-2">
                                                    <use xlinkHref="#custom-lock-outline" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>

                        </ul>
                    </div>
                </div>
            </header>

            <ChangePasswordModal
                open={showChangePassword}
                onClose={() => setShowChangePassword(false)}
            />
        </>
    );
};

export default Navbar;

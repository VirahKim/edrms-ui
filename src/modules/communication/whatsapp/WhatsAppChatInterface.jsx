import React, { useState, useEffect } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import ConversationListItem from "./components/ConversationListItem";
import ChatWindow from "./components/ChatWindow";
import NewConversationModal from "./components/NewConversationModal";
import whatsappApi from "../../../api/whatsappApi";

/**
 * WhatsAppChatInterface - Main WhatsApp chat application
 * Modern chat interface with conversation list and chat window
 */
export default function WhatsAppChatInterface() {
  const [contacts, setContacts] = useState([]); // Changed from conversations to contacts (grouped)
  const [filteredContacts, setFilteredContacts] = useState([]); // Changed from filteredConversations
  const [selectedContact, setSelectedContact] = useState(null); // Track selected contact
  const [selectedConversation, setSelectedConversation] = useState(null); // Track selected conversation within contact
  const [expandedContactIds, setExpandedContactIds] = useState(new Set()); // Track which contacts are expanded
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [unreadStats, setUnreadStats] = useState({ totalConversationsWithUnread: 0, totalUnreadMessages: 0 });
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  // Toggle fullscreen mode - hide sidebar and navbar
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('whatsapp-fullscreen');
    } else {
      document.body.classList.remove('whatsapp-fullscreen');
    }
    return () => {
      document.body.classList.remove('whatsapp-fullscreen');
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (selectedPhoneNumber) {
      loadConversations();
      loadUnreadStats();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(() => {
        loadConversations();
        loadUnreadStats();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [selectedPhoneNumber, filterStatus]);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, filterStatus]);

  const loadPhoneNumbers = async () => {
    try {
      const response = await whatsappApi.getWABAs();
      const wabas = response.data || [];
      
      // Extract all phone numbers from all WABAs and normalize to camelCase
      const allPhoneNumbers = [];
      wabas.forEach(waba => {
        const phoneNumbers = waba.PhoneNumbers || waba.phoneNumbers || [];
        phoneNumbers.forEach(phone => {
          allPhoneNumbers.push({
            id: phone.Id || phone.id,
            wabaId: phone.WabaId || phone.wabaId,
            metaPhoneNumberId: phone.MetaPhoneNumberId || phone.metaPhoneNumberId,
            displayPhoneNumber: phone.DisplayPhoneNumber || phone.displayPhoneNumber,
            verifiedName: phone.VerifiedName || phone.verifiedName,
            qualityRating: phone.QualityRating || phone.qualityRating || 'UNKNOWN',
            messagingLimit: phone.MessagingLimit || phone.messagingLimit || 0,
            isActive: phone.IsActive ?? phone.isActive ?? true,
            wabaName: waba.BusinessName || waba.businessName
          });
        });
      });

      setPhoneNumbers(allPhoneNumbers);
      
      // Auto-select first active phone number
      const firstActivePhone = allPhoneNumbers.find(p => p.isActive);
      if (firstActivePhone) {
        setSelectedPhoneNumber(firstActivePhone.id);
      } else if (allPhoneNumbers.length > 0) {
        setSelectedPhoneNumber(allPhoneNumbers[0].id);
      } else {
        setError("No WhatsApp phone numbers configured. Please configure a WABA first.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load phone numbers:", err);
      setError("Failed to load WhatsApp configuration");
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!selectedPhoneNumber) return;

    try {
      const params = {
        phoneNumberId: selectedPhoneNumber
      };

      // For grouped API, use hasOpenConversation filter
      if (filterStatus === "open") {
        params.hasOpenConversation = true;
      }
      // Note: "closed" filter will show all contacts but we'll filter client-side
      // "all" shows everything

      const response = await whatsappApi.getGroupedConversations(params);
      const data = response.data || [];
      
      // Normalize API response from PascalCase to camelCase
      const normalized = data.map(contact => ({
        ContactId: contact.ContactId || contact.contactId,
        ContactName: contact.ContactName || contact.contactName,
        ContactWaId: contact.ContactWaId || contact.contactWaId,
        LastMessageText: contact.LastMessageText || contact.lastMessageText,
        LastMessageTime: contact.LastMessageTime || contact.lastMessageTime,
        TotalUnreadCount: contact.TotalUnreadCount || contact.totalUnreadCount || 0,
        HasOpenConversation: contact.HasOpenConversation ?? contact.hasOpenConversation ?? false,
        Conversations: (contact.Conversations || contact.conversations || []).map(conv => ({
          ConversationId: conv.ConversationId || conv.conversationId,
          IsOpen: conv.IsOpen ?? conv.isOpen ?? false,
          ConversationType: conv.ConversationType || conv.conversationType,
          LastMessageText: conv.LastMessageText || conv.lastMessageText,
          LastMessageTime: conv.LastMessageTime || conv.lastMessageTime,
          StartedAt: conv.StartedAt || conv.startedAt,
          UnreadCount: conv.UnreadCount || conv.unreadCount || 0
        }))
      }));
      
      setContacts(normalized);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError("Failed to load conversations");
      setLoading(false);
    }
  };

  const loadUnreadStats = async () => {
    if (!selectedPhoneNumber) return;

    try {
      const response = await whatsappApi.getUnreadStats({ phoneNumberId: selectedPhoneNumber });
      const data = response.data || {};
      setUnreadStats({
        totalConversationsWithUnread: data.TotalConversationsWithUnread || data.totalConversationsWithUnread || 0,
        totalUnreadMessages: data.TotalUnreadMessages || data.totalUnreadMessages || 0
      });
    } catch (err) {
      console.error("Failed to load unread stats:", err);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Apply conversation status filter
    if (filterStatus === "open") {
      // Show only contacts with open conversations
      filtered = filtered.filter(contact => contact.HasOpenConversation);
    } else if (filterStatus === "closed") {
      // Show contacts that have only closed conversations
      filtered = filtered.filter(contact => !contact.HasOpenConversation);
    }
    // "all" shows everything, no filter needed

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        (contact.ContactName && contact.ContactName.toLowerCase().includes(search)) ||
        (contact.ContactWaId && contact.ContactWaId.includes(search)) ||
        (contact.LastMessageText && contact.LastMessageText.toLowerCase().includes(search))
      );
    }

    setFilteredContacts(filtered);
  };

  const handleContactToggle = (contact) => {
    const contactId = contact.ContactId;
    const newExpanded = new Set(expandedContactIds);
    
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    
    setExpandedContactIds(newExpanded);
  };

  const handleConversationSelect = (contact, conversation) => {
    setSelectedContact(contact);
    // Create a conversation object compatible with ChatWindow
    setSelectedConversation({
      Id: conversation.ConversationId,
      ContactName: contact.ContactName,
      ContactWaId: contact.ContactWaId,
      IsOpen: conversation.IsOpen,
      LastMessageText: conversation.LastMessageText,
      LastMessageTime: conversation.LastMessageTime
    });
  };

  const handleConversationUpdate = () => {
    loadConversations();
    loadUnreadStats();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  const handlePhoneNumberChange = (e) => {
    const newPhoneNumberId = parseInt(e.target.value);
    setSelectedPhoneNumber(newPhoneNumberId);
    setSelectedContact(null);
    setSelectedConversation(null);
    setExpandedContactIds(new Set());
    setSearchTerm("");
    setFilterStatus("open");
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = () => {
    // Reload conversations after creating a new one
    loadConversations();
    loadUnreadStats();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const selectedPhoneNumberData = phoneNumbers.find(p => p.id === selectedPhoneNumber);

  return (
    <DashboardLayout>
      <div className="whatsapp-container" style={{ 
        height: isFullscreen ? "100vh" : "calc(100vh - 200px)", 
        maxHeight: isFullscreen ? "100vh" : "calc(100vh - 200px)",
        overflow: "hidden",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        right: isFullscreen ? 0 : "auto",
        bottom: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
        backgroundColor: "var(--bs-card-bg, #fff)"
      }}>
        <div className="card h-100 mb-0" style={{ border: "none", overflow: "hidden" }}>
          <div className="card-body p-0 d-flex flex-column h-100" style={{ overflow: "hidden" }}>
              {/* Top Header */}
              <div className="whatsapp-header border-bottom p-3 bg-success text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-0 text-white">
                      <i className="ti ti-brand-whatsapp me-2"></i>
                      WhatsApp Business
                    </h4>
                    <p className="mb-0 small text-white-50">
                      Professional messaging platform
                    </p>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    {/* Fullscreen Toggle Button */}
                    <button
                      className="btn btn-sm btn-light text-white border-white"
                      onClick={toggleFullscreen}
                      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                    >
                      <i className={`ti ti-${isFullscreen ? 'minimize' : 'maximize'}`}></i>
                    </button>

                    {/* Unread Stats Badges */}
                    {unreadStats.totalUnreadMessages > 0 && (
                      <div className="d-flex gap-2">
                        <div className="badge bg-danger rounded-pill px-3 py-2" title="Unread messages">
                          <i className="ti ti-message me-1"></i>
                          {unreadStats.totalUnreadMessages} {unreadStats.totalUnreadMessages === 1 ? 'Message' : 'Messages'}
                        </div>
                        {unreadStats.totalConversationsWithUnread > 0 && (
                          <div className="badge bg-warning rounded-pill px-3 py-2" title="Conversations with unread messages">
                            <i className="ti ti-message-circle me-1"></i>
                            {unreadStats.totalConversationsWithUnread} {unreadStats.totalConversationsWithUnread === 1 ? 'Chat' : 'Chats'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phone Number Selector */}
                    {phoneNumbers.length > 1 && (
                      <div className="d-flex align-items-center gap-2">
                        <label htmlFor="phoneNumberSelector" className="mb-0 small text-white-50">
                          <i className="ti ti-device-mobile me-1"></i>
                          Active Number:
                        </label>
                        <select
                          id="phoneNumberSelector"
                          className="form-select form-select-sm text-white bg-success border-white"
                          value={selectedPhoneNumber || ""}
                          onChange={handlePhoneNumberChange}
                          style={{ minWidth: "280px", fontWeight: "500" }}
                        >
                          {phoneNumbers.map(phone => (
                            <option key={phone.id} value={phone.id} className="text-dark">
                              {phone.displayPhoneNumber} - {phone.verifiedName} ({phone.wabaName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Phone Number Info */}
                {selectedPhoneNumberData && (
                  <div className="mt-2 d-flex gap-3 small text-white-50">
                    <span>
                      <i className="ti ti-phone me-1"></i>
                      {selectedPhoneNumberData.displayPhoneNumber}
                    </span>
                    <span>
                      <i className="ti ti-user me-1"></i>
                      {selectedPhoneNumberData.verifiedName}
                    </span>
                    <span className={`badge ${
                      selectedPhoneNumberData.qualityRating === 'GREEN' ? 'bg-success' :
                      selectedPhoneNumberData.qualityRating === 'YELLOW' ? 'bg-warning' :
                      'bg-danger'
                    }`}>
                      Quality: {selectedPhoneNumberData.qualityRating}
                    </span>
                    {selectedPhoneNumberData.messagingLimit > 0 && (
                      <span className="badge bg-info">
                        <i className="ti ti-send me-1"></i>
                        Limit: {selectedPhoneNumberData.messagingLimit}/day
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
              )}

              {/* Main Chat Area */}
              <div className="flex-grow-1 d-flex overflow-hidden" style={{ minHeight: 0 }}>
                {/* Conversations Sidebar */}
                <div className="conversations-sidebar border-end d-flex flex-column" style={{ width: "380px", minWidth: "320px", maxHeight: "100%", overflow: "hidden", backgroundColor: "var(--bs-card-bg, #fff)" }}>
                  {/* Search and Filter - Fixed Header */}
                  <div className="p-3 border-bottom" style={{ flexShrink: 0 }}>
                    {/* New Conversation Button */}
                    <button
                      className="btn btn-primary w-100 mb-3"
                      onClick={handleNewConversation}
                      disabled={!selectedPhoneNumber}
                    >
                      <i className="ti ti-plus me-1"></i>
                      New Conversation
                    </button>

                    <div className="input-group mb-3">
                      <span className="input-group-text" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                        <i className="ti ti-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>

                  {/* Conversations List - Scrollable */}
                  <div className="conversations-list overflow-auto flex-grow-1" style={{ minHeight: 0 }}>
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <div className="text-center text-muted py-5 px-3">
                        <i className="ti ti-message-circle-off" style={{ fontSize: "48px" }}></i>
                        <p className="mt-3 mb-0">No conversations found</p>
                        {searchTerm && (
                          <p className="small">Try adjusting your search</p>
                        )}
                      </div>
                    ) : (
                      filteredContacts.map(contact => (
                        <ConversationListItem
                          key={contact.ContactId}
                          contact={contact}
                          isExpanded={expandedContactIds.has(contact.ContactId)}
                          selectedConversationId={selectedConversation?.Id}
                          onToggle={() => handleContactToggle(contact)}
                          onSelect={(conversation) => handleConversationSelect(contact, conversation)}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="flex-grow-1">
                  <ChatWindow
                    conversation={selectedConversation}
                    phoneNumberId={selectedPhoneNumber}
                    onConversationUpdate={handleConversationUpdate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        show={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        phoneNumberId={selectedPhoneNumber}
        onConversationCreated={handleConversationCreated}
      />
    </DashboardLayout>
  );
}

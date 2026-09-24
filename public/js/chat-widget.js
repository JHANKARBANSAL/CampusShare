// ==========================================================
// CAMPUSSHARE LIVE CHAT WIDGET (Socket.IO + WebSockets)
// Faithful reproduction of Message.png mockup:
// - Real-time two-way messaging
// - Online / Offline status indicator
// - Item summary banner with status pill
// - Minimize / Expand / Close controls
// - XSS protection via escapeHTML
// - Unread message audio & title alerts
// ==========================================================

(function () {
    let socket = null;
    let activeTransactionId = null;
    let currentChatData = null;
    let isMinimized = false;
    let unreadCount = 0;
    let typingTimer = null;
    const currentUserId = getUserIdFromToken();

    // ---------- Helper: Safe HTML Escaping (Fix 1: XSS) ----------
    function escapeHTML(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ---------- Helper: Parse User ID from JWT ----------
    function getUserIdFromToken() {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            return JSON.parse(jsonPayload).userId;
        } catch (e) {
            return null;
        }
    }

    // ---------- Helper: Format time for bubbles ----------
    function formatTime(dateStr) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    // ---------- Build Widget HTML in DOM ----------
    function injectWidgetDOM() {
        if (document.getElementById("csChatWidget")) return;

        const widgetHTML = `
        <!-- Main Chat Box -->
        <div id="csChatWidget" class="cs-chat-widget hidden">
            <!-- 1. Header -->
            <div class="cs-chat-header">
                <div class="cs-chat-header-user">
                    <div class="cs-chat-avatar-wrap">
                        <img id="csChatHeaderAvatar" class="cs-chat-avatar" src="../images/icons8-customer-48.png" alt="Avatar">
                        <span id="csChatOnlineDot" class="cs-chat-online-dot"></span>
                    </div>
                    <div class="cs-chat-user-info">
                        <span id="csChatHeaderName" class="cs-chat-user-name">Loading...</span>
                        <span id="csChatHeaderStatus" class="cs-chat-user-status">
                            <span class="status-dot-inline"></span>
                            <span id="csChatStatusText">Online</span>
                        </span>
                    </div>
                </div>
                <div class="cs-chat-controls">
                    <button id="csChatBtnMinimize" class="cs-chat-btn-control" title="Minimize">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button id="csChatBtnExpand" class="cs-chat-btn-control" title="Expand Full View">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                    </button>
                    <button id="csChatBtnClose" class="cs-chat-btn-control" title="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            <!-- 2. Item Context Banner -->
            <div class="cs-chat-item-banner">
                <div class="cs-chat-item-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="18" rx="3" ry="3"></rect>
                        <line x1="6" y1="8" x2="18" y2="8"></line>
                        <line x1="6" y1="12" x2="18" y2="12"></line>
                        <line x1="6" y1="16" x2="18" y2="16"></line>
                    </svg>
                </div>
                <div class="cs-chat-item-info">
                    <div class="cs-chat-item-title-row">
                        <span id="csChatItemTitle" class="cs-chat-item-title">Item Name</span>
                        <span id="csChatItemStatus" class="cs-chat-status-badge">Active</span>
                    </div>
                    <div id="csChatItemSub" class="cs-chat-item-sub">Duration info</div>
                </div>
            </div>

            <!-- 3. Date Divider -->
            <div class="cs-chat-date-divider">
                <span>Today</span>
            </div>

            <!-- 4. Messages Container -->
            <div id="csChatMessages" class="cs-chat-messages"></div>

            <!-- 5. Typing Indicator -->
            <div id="csChatTyping" class="cs-typing-indicator">
                <span id="csChatTypingName"></span> is typing
                <span class="cs-typing-dots">
                    <span class="cs-typing-dot"></span>
                    <span class="cs-typing-dot"></span>
                    <span class="cs-typing-dot"></span>
                </span>
            </div>

            <!-- 6. Footer / Input -->
            <form id="csChatForm" class="cs-chat-footer">
                <button type="button" class="cs-chat-attach-btn" title="Attach file">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <div class="cs-chat-input-wrap">
                    <input id="csChatInput" class="cs-chat-input" type="text" placeholder="Type a message..." maxlength="1000" autocomplete="off" />
                </div>
                <button type="submit" class="cs-chat-send-btn" title="Send">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </form>
        </div>

        <!-- Minimized Floating Pill -->
        <div id="csChatMinPill" class="cs-chat-minimized-pill hidden">
            <div id="csChatMinAvatar" class="cs-chat-min-avatar">💬</div>
            <span id="csChatMinText" class="cs-chat-min-text">Chat</span>
            <span id="csChatMinBadge" class="cs-chat-min-badge hidden">0</span>
        </div>
        `;

        document.body.insertAdjacentHTML("beforeend", widgetHTML);
        bindWidgetEvents();
    }

    // ---------- Event Bindings ----------
    function bindWidgetEvents() {
        const form = document.getElementById("csChatForm");
        const input = document.getElementById("csChatInput");
        const btnMin = document.getElementById("csChatBtnMinimize");
        const btnExp = document.getElementById("csChatBtnExpand");
        const btnClose = document.getElementById("csChatBtnClose");
        const minPill = document.getElementById("csChatMinPill");

        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                sendMessage();
            });
        }

        if (input) {
            input.addEventListener("input", () => {
                if (!socket || !activeTransactionId) return;
                socket.emit("typing", { transactionId: activeTransactionId });
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    socket.emit("stop_typing", { transactionId: activeTransactionId });
                }, 1200);
            });
        }

        if (btnMin) {
            btnMin.addEventListener("click", () => {
                minimizeWidget();
            });
        }

        if (minPill) {
            minPill.addEventListener("click", () => {
                restoreWidget();
            });
        }

        if (btnExp) {
            btnExp.addEventListener("click", () => {
                if (activeTransactionId) {
                    window.location.href = `./transaction-details.html?id=${activeTransactionId}`;
                }
            });
        }

        if (btnClose) {
            btnClose.addEventListener("click", () => {
                closeWidget();
            });
        }
    }

    // ---------- Initialize Socket Connection ----------
    function initSocket() {
        const token = localStorage.getItem("token");
        if (!token) return;

        if (socket && socket.connected) return;

        if (typeof io === "undefined") {
            // Dynamically load Socket.IO client if not already on page
            const script = document.createElement("script");
            script.src = "/socket.io/socket.io.js";
            script.onload = () => {
                connectSocketIO(token);
            };
            document.head.appendChild(script);
        } else {
            connectSocketIO(token);
        }
    }

    function connectSocketIO(token) {
        socket = io({
            auth: { token }
        });

        socket.on("connect", () => {
            if (activeTransactionId) {
                socket.emit("join_chat", { transactionId: activeTransactionId });
            }
        });

        socket.on("receive_message", (message) => {
            handleIncomingMessage(message);
        });

        socket.on("chat_joined", ({ otherUserOnline }) => {
            updateOnlineStatus(otherUserOnline);
        });

        socket.on("user_online_status", ({ userId, isOnline }) => {
            if (currentChatData && currentChatData.otherUser && currentChatData.otherUser.id === userId) {
                updateOnlineStatus(isOnline);
            }
        });

        socket.on("user_typing", ({ transactionId, userId }) => {
            if (transactionId === activeTransactionId && userId !== currentUserId) {
                document.getElementById("csChatTypingName").textContent = currentChatData.otherUser.name; 
                const typingEl = document.getElementById("csChatTyping");
                if (typingEl) typingEl.style.display = "flex";
            }
        });

        socket.on("user_stop_typing", ({ transactionId }) => {
            if (transactionId === activeTransactionId) {
                const typingEl = document.getElementById("csChatTyping");
                if (typingEl) typingEl.style.display = "none";
            }
        });
    }

    // ---------- Open Chat Widget for a Transaction ----------
    async function openChatWidget(transactionId) {
        if (!transactionId) return;

        const token = localStorage.getItem("token");
        if (!token) {
            sessionStorage.setItem("cs_active_chat_txn", transactionId);
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `./login.html?redirect=${returnUrl}`;
            return;
        }

        injectWidgetDOM();
        initSocket();

        activeTransactionId = transactionId;
        sessionStorage.setItem("cs_active_chat_txn", transactionId);

        const widget = document.getElementById("csChatWidget");
        const minPill = document.getElementById("csChatMinPill");
        if (minPill) minPill.classList.add("hidden");
        if (widget) widget.classList.remove("hidden");
        isMinimized = false;
        unreadCount = 0;

        // Fetch transaction and previous chat history
        try {
            const res = await fetch(`/api/chat/${transactionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                console.log("Chat history fetch failed");
                return;
            }

            const data = await res.json();
            currentChatData = data.transaction;

            renderHeaderAndBanner(data.transaction);
            renderMessages(data.messages);

            // Join socket room
            if (socket && socket.connected) {
                socket.emit("join_chat", { transactionId });
            }

            // Mark read
            fetch(`/api/chat/${transactionId}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {});

            // Focus input
            setTimeout(() => {
                const input = document.getElementById("csChatInput");
                if (input) input.focus();
            }, 100);

        } catch (err) {
            console.log("Error loading chat widget:", err);
        }
    }

    // ---------- Render UI Components ----------
    function renderHeaderAndBanner(txn) {
        const nameEl = document.getElementById("csChatHeaderName");
        const avatarEl = document.getElementById("csChatHeaderAvatar");
        const itemTitleEl = document.getElementById("csChatItemTitle");
        const itemStatusEl = document.getElementById("csChatItemStatus");
        const itemSubEl = document.getElementById("csChatItemSub");
        const minTextEl = document.getElementById("csChatMinText");
        const minAvatarEl = document.getElementById("csChatMinAvatar");

        if (nameEl) nameEl.textContent = txn.otherUser.name;
        if (minTextEl) minTextEl.textContent = txn.otherUser.name;

        if (avatarEl) {
            if (txn.otherUser.profileImage) {
                avatarEl.src = txn.otherUser.profileImage;
            } else {
                avatarEl.src = "../images/icons8-customer-48.png";
            }
        }

        if (minAvatarEl && txn.otherUser.name) {
            minAvatarEl.textContent = txn.otherUser.name.charAt(0).toUpperCase();
        }

        if (itemTitleEl) itemTitleEl.textContent = txn.itemName;
        if (itemStatusEl) {
            itemStatusEl.textContent = txn.status === "borrowed" ? "Active" : txn.status;
        }
        if (itemSubEl) {
            itemSubEl.textContent = `${txn.role === "borrower" ? "Lending from" : "Borrowing"} • ${txn.duration || "Item"}`;
        }
    }

    function renderMessages(messages) {
        const container = document.getElementById("csChatMessages");
        if (!container) return;

        container.innerHTML = "";
        messages.forEach((msg) => {
            appendMessageBubble(msg);
        });

        scrollToBottom();
    }

    function appendMessageBubble(msg) {
        const container = document.getElementById("csChatMessages");
        if (!container) return;

        const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
        const isOutgoing = senderId === currentUserId;
        const timeStr = formatTime(msg.createdAt);

        const row = document.createElement("div");
        row.className = `cs-message-row ${isOutgoing ? "outgoing" : "incoming"}`;

        const senderAvatar = (typeof msg.sender === "object" && msg.sender.profileImage)
            ? msg.sender.profileImage
            : "../images/icons8-customer-48.png";

        if (isOutgoing) {
            row.innerHTML = `
                <div class="cs-message-bubble-wrap">
                    <div class="cs-message-bubble">${escapeHTML(msg.text)}</div>
                    <div class="cs-message-meta">
                        <span>${timeStr}</span>
                        <span class="cs-double-check">✓✓</span>
                    </div>
                </div>
            `;
        } else {
            row.innerHTML = `
                <img class="cs-message-avatar" src="${senderAvatar}" alt="">
                <div class="cs-message-bubble-wrap">
                    <div class="cs-message-bubble">${escapeHTML(msg.text)}</div>
                    <div class="cs-message-meta">
                        <span>${timeStr}</span>
                    </div>
                </div>
            `;
        }

        container.appendChild(row);
    }

    function handleIncomingMessage(msg) {
        if (msg.transaction !== activeTransactionId) return;

        appendMessageBubble(msg);
        scrollToBottom();

        // Hide typing indicator
        const typingEl = document.getElementById("csChatTyping");
        if (typingEl) typingEl.style.display = "none";

        const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
        const isOutgoing = senderId === currentUserId;

        if (!isOutgoing) {
            if (isMinimized) {
                unreadCount++;
                const badge = document.getElementById("csChatMinBadge");
                if (badge) {
                    badge.textContent = unreadCount;
                    badge.classList.remove("hidden");
                }
            }

            // Notification alert in document title
            notifyNewMessage(msg);
        }
    }

    function notifyNewMessage(msg) {
        const originalTitle = document.title;
        const senderName = (typeof msg.sender === "object" && msg.sender.name) ? msg.sender.name : "Classmate";
        document.title = `(1) ${senderName}: ${msg.text.slice(0, 20)}...`;

        setTimeout(() => {
            document.title = originalTitle;
        }, 3500);

        if (typeof showToast === "function") {
            showToast(`${senderName}: ${msg.text}`, "info");
        }
    }

    function updateOnlineStatus(isOnline) {
        const dot = document.getElementById("csChatOnlineDot");
        const inlineDot = document.querySelector(".status-dot-inline");
        const statusText = document.getElementById("csChatStatusText");

        if (dot) {
            if (isOnline) {
                dot.classList.remove("offline");
                if (inlineDot) inlineDot.classList.remove("offline");
                if (statusText) statusText.textContent = "Online";
            } else {
                dot.classList.add("offline");
                if (inlineDot) inlineDot.classList.add("offline");
                if (statusText) statusText.textContent = "Offline";
            }
        }
    }

    function scrollToBottom() {
        const container = document.getElementById("csChatMessages");
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // ---------- Send Message Action ----------
    function sendMessage() {
        const input = document.getElementById("csChatInput");
        if (!input) return;

        const text = input.value.trim();
        if (!text || !activeTransactionId) return;

        if (socket && socket.connected) {
            socket.emit("send_message", {
                transactionId: activeTransactionId,
                text
            });
            socket.emit("stop_typing", { transactionId: activeTransactionId });
        }

        input.value = "";
    }

    // ---------- Widget Controls ----------
    function minimizeWidget() {
        const widget = document.getElementById("csChatWidget");
        const minPill = document.getElementById("csChatMinPill");

        if (widget) widget.classList.add("hidden");
        if (minPill) minPill.classList.remove("hidden");
        isMinimized = true;
    }

    function restoreWidget() {
        const widget = document.getElementById("csChatWidget");
        const minPill = document.getElementById("csChatMinPill");
        const badge = document.getElementById("csChatMinBadge");

        if (minPill) minPill.classList.add("hidden");
        if (widget) widget.classList.remove("hidden");
        if (badge) badge.classList.add("hidden");

        isMinimized = false;
        unreadCount = 0;
        scrollToBottom();
    }

    function closeWidget() {
        const widget = document.getElementById("csChatWidget");
        const minPill = document.getElementById("csChatMinPill");

        if (widget) widget.classList.add("hidden");
        if (minPill) minPill.classList.add("hidden");

        if (socket && activeTransactionId) {
            socket.emit("leave_chat", { transactionId: activeTransactionId });
        }

        activeTransactionId = null;
        sessionStorage.removeItem("cs_active_chat_txn");
    }

    // ---------- Expose Global Function ----------
    window.openChatWidget = openChatWidget;

    // ---------- Auto-restore or open from email URL (?chat=ID) ----------
    document.addEventListener("DOMContentLoaded", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const chatTxnFromUrl = urlParams.get("chat");
        const savedTxn = sessionStorage.getItem("cs_active_chat_txn");
        const token = localStorage.getItem("token");

        // Agar URL me ?chat=ID aaya hai to turant chat box kholo
        if (chatTxnFromUrl) {
            openChatWidget(chatTxnFromUrl);
        } else if (savedTxn && token) {
            openChatWidget(savedTxn);
        }
    });

})();

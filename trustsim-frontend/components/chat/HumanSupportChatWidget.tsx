"use client";

/* Hallmark · pre-emit critique: P4 H4 E4 S5 R5 V3 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Headset, History, MessageCircle, Minus, Paperclip, Send, X } from "lucide-react";
import { authService } from "@/services/authService";
import { ensureFreshAccessToken } from "@/services/authSession";
import { getApiBaseUrl } from "@/services/apiConfig";
import { chatService, type ChatConversation, type ChatMessage } from "@/services/chatService";

const formatTime = (value: string) => new Date(value).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

export function HumanSupportChatWidget() {
  const [user, setUser] = useState<ReturnType<typeof authService.getUser>>(null);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);
  const activeRef = useRef(activeId);
  const openRef = useRef(open);
  const userIdRef = useRef<string | null>(null);
  activeRef.current = activeId;
  openRef.current = open;

  useEffect(() => {
    const syncUser = () => {
      const next = authService.getUser();
      if (userIdRef.current !== (next?.userId || null)) {
        setOpen(false); setActiveId(""); setConversations([]); setMessages([]);
        userIdRef.current = next?.userId || null;
      }
      setUser(next);
    };
    syncUser();
    const onAiOpen = () => setOpen(false);
    const onSupportOpen = () => { setOpen(true); setHistory(false); };
    window.addEventListener("trustsim_auth_change", syncUser);
    window.addEventListener("storage", syncUser);
    window.addEventListener("open_ai_chat", onAiOpen);
    window.addEventListener("open_human_chat", onSupportOpen);
    return () => { window.removeEventListener("trustsim_auth_change", syncUser); window.removeEventListener("storage", syncUser); window.removeEventListener("open_ai_chat", onAiOpen); window.removeEventListener("open_human_chat", onSupportOpen); };
  }, []);

  const refreshList = useCallback(async () => {
    const result = await chatService.list("SUPPORT");
    setConversations(result.items);
    if (!activeRef.current && result.items[0]) setActiveId(result.items[0].id);
  }, []);

  const refreshMessages = useCallback(async (id: string) => {
    const result = await chatService.messages(id);
    setMessages([...result.items].reverse());
    void chatService.read(id).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || user.role?.toUpperCase() !== "USER") return;
    void refreshList().catch(() => {});
    const timer = window.setInterval(() => { void refreshList().catch(() => {}); }, 15000);
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/chat`, { accessTokenFactory: async () => (await ensureFreshAccessToken(60)) || "" })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();
    const sync = () => {
      void refreshList().catch(() => {});
      if (openRef.current && activeRef.current) void refreshMessages(activeRef.current).catch(() => {});
    };
    hub.on("ReceiveChatMessage", sync);
    hub.on("ReceiveConversationUpdated", sync);
    hub.on("ReceiveMessagesRead", sync);
    void hub.start().catch(() => {});
    return () => { window.clearInterval(timer); void hub.stop(); };
  }, [user, refreshList, refreshMessages]);

  useEffect(() => {
    if (!open || !activeId) return;
    nearBottomRef.current = true;
    setLoading(true);
    void refreshMessages(activeId).catch((cause) => setError(cause instanceof Error ? cause.message : "Không thể tải tin nhắn")).finally(() => setLoading(false));
  }, [open, activeId, refreshMessages]);

  useEffect(() => {
    if (!open || !activeId) return;
    const timer = window.setInterval(() => { void refreshMessages(activeId).catch(() => {}); }, 12000);
    return () => window.clearInterval(timer);
  }, [open, activeId, refreshMessages]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list && nearBottomRef.current) list.scrollTop = list.scrollHeight;
  }, [messages, open, history]);

  if (!user || user.role?.toUpperCase() !== "USER") return null;

  const selected = conversations.find((item) => item.id === activeId);
  const unreadCount = conversations.reduce((sum, item) => sum + item.unreadCount, 0);
  const canSend = selected?.supportStatus === "PENDING" || selected?.supportStatus === "CLAIMED";
  const openWidget = () => { window.dispatchEvent(new Event("open_human_chat")); setError(""); };
  const createRequest = async () => {
    setBusy(true); setError("");
    try {
      const next = await chatService.support();
      setActiveId(next.id); setHistory(false); nearBottomRef.current = true;
      await refreshList();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể mở yêu cầu hỗ trợ"); }
    finally { setBusy(false); }
  };
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || busy || (!draft.trim() && !attachment)) return;
    setBusy(true); setError("");
    try {
      await chatService.send(selected.id, draft, attachment || undefined);
      setDraft(""); setAttachment(null); nearBottomRef.current = true;
      if (fileRef.current) fileRef.current.value = "";
      await Promise.all([refreshMessages(selected.id), refreshList()]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể gửi tin nhắn"); }
    finally { setBusy(false); }
  };

  return <>
    {!open && <button type="button" onClick={openWidget} aria-label="Chat với nhân viên TrustSim" className="fixed bottom-4 right-[76px] z-[901] flex h-12 items-center gap-2 rounded-full border border-[#dfe5f2] bg-white px-3 text-[#001743] shadow-[0_8px_30px_rgba(0,23,67,.12)] transition hover:border-[#8c9cff] hover:bg-[#f7f8fd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4c5fd5] active:scale-[.98] sm:bottom-6 sm:right-[230px] sm:px-4"><Headset size={19} /><span className="hidden text-xs font-semibold sm:inline">Nhân viên hỗ trợ</span>{unreadCount > 0 && <span className="grid min-w-5 h-5 place-items-center rounded-full bg-[#001743] px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>}
    {open && <section aria-label="Chat với nhân viên TrustSim" className="fixed bottom-20 right-4 z-[1001] flex h-[min(600px,calc(100dvh-104px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-[#dfe5f2] bg-white shadow-[0_20px_70px_rgba(0,23,67,.18)] sm:bottom-24 sm:right-6">
      <header className="flex items-center gap-3 border-b border-[#e6eaf5] bg-[linear-gradient(125deg,#f1f3ff,#fff)] px-4 py-3 text-[#001743]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#001743] text-white"><Headset size={18} /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">Nhân viên TrustSim</h2><p className="truncate text-[11px] text-[#5b6477]">{selected?.supportStatus === "PENDING" ? "Đang chờ tiếp nhận" : selected?.supportStatus === "CLAIMED" ? "Hỗ trợ riêng tư" : "Trao đổi trực tiếp với nhân viên"}</p></div><button type="button" onClick={() => setHistory((value) => !value)} title="Lịch sử hỗ trợ" aria-label="Lịch sử hỗ trợ" className="rounded-md p-2 hover:bg-[#e9edfc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4c5fd5]"><History size={17} /></button><button type="button" onClick={() => setOpen(false)} title="Thu nhỏ" aria-label="Thu nhỏ chat" className="rounded-md p-2 hover:bg-[#e9edfc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4c5fd5]"><Minus size={18} /></button></header>
      {history ? <div className="min-h-0 flex-1 overflow-y-auto p-3"><button type="button" disabled={busy} onClick={createRequest} className="mb-3 w-full rounded-lg bg-[#001743] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#0b2a6b] disabled:opacity-50">Yêu cầu hỗ trợ mới</button>{conversations.map((item) => <button key={item.id} type="button" onClick={() => { setActiveId(item.id); setHistory(false); }} className={`mb-1 w-full rounded-md border px-3 py-2.5 text-left hover:bg-[#f7f8fd] ${item.id === activeId ? "border-[#8c9cff] bg-[#f1f3ff]" : "border-[#edf0f7]"}`}><span className="block truncate text-xs font-semibold text-[#001743]">{item.displayTitle}</span><span className="mt-1 block truncate text-[11px] text-[#5b6477]">{item.lastMessagePreview || "Chưa có tin nhắn"}</span></button>)}</div> : <>
        {!selected ? <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-8 text-center"><MessageCircle size={28} className="text-[#8c9cff]" /><p className="text-sm text-[#5b6477]">Cần hỗ trợ về giao dịch hoặc tài khoản? Gửi yêu cầu để nhân viên tiếp nhận.</p><button type="button" disabled={busy} onClick={createRequest} className="rounded-lg bg-[#001743] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0b2a6b] disabled:opacity-50">{busy ? "Đang mở…" : "Bắt đầu trò chuyện"}</button></div> : <>
          <div ref={listRef} onScroll={(event) => { const el = event.currentTarget; nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 72; }} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7f8fd] p-4">{loading && <p className="text-center text-xs text-[#98a1b3]">Đang tải tin nhắn…</p>}{messages.map((message) => { const mine = message.senderId.toLowerCase() === user.userId.toLowerCase(); if (message.messageType === "SYSTEM") return <p key={message.id} className="text-center text-[11px] text-[#5b6477]">{message.content}</p>; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${mine ? "bg-[#001743] text-white" : "border border-[#e4e9f4] bg-white text-[#0b1630]"}`}><p className="whitespace-pre-wrap break-words">{message.content}</p>{message.attachmentUrl && (message.isAttachmentExpired ? <span className="mt-2 block text-[11px] opacity-70">Tệp đã hết hạn</span> : <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-[11px] underline">{message.attachmentFileName || "Mở tệp đính kèm"}</a>)}<time className={`mt-1 block text-right text-[10px] ${mine ? "text-[#c7d0ff]" : "text-[#5b6477]"}`}>{formatTime(message.createdDate)}</time></div></div>; })}</div>
          {canSend ? <form onSubmit={send} className="border-t border-[#e4e9f4] p-3"><div className="flex items-end gap-2"><input ref={fileRef} type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} /><button type="button" onClick={() => fileRef.current?.click()} aria-label="Đính kèm ảnh hoặc PDF" className="grid h-10 w-9 place-items-center rounded-md text-[#5b6477] hover:bg-[#f1f3ff]"><Paperclip size={17} /></button><textarea rows={1} maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nhập tin nhắn…" className="max-h-24 min-h-10 flex-1 resize-none rounded-md border border-[#dfe5f2] px-3 py-2 text-sm text-[#0b1630] outline-none focus-visible:border-[#4c5fd5]" /><button type="submit" disabled={busy || (!draft.trim() && !attachment)} aria-label="Gửi tin nhắn" className="grid h-10 w-10 place-items-center rounded-md bg-[#001743] text-white hover:bg-[#0b2a6b] disabled:opacity-40"><Send size={17} /></button></div>{attachment && <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5b6477]"><span className="min-w-0 flex-1 truncate">{attachment.name}</span><button type="button" onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="Bỏ tệp đính kèm"><X size={13} /></button></div>}</form> : <div className="border-t border-[#e4e9f4] p-3 text-center"><p className="mb-2 text-xs text-[#5b6477]">Phiên hỗ trợ đã kết thúc.</p><button type="button" disabled={busy} onClick={createRequest} className="rounded-md bg-[#001743] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Yêu cầu hỗ trợ mới</button></div>}
        </>}
      </>}
      {error && <div role="alert" className="border-t border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}
    </section>}
  </>;
}

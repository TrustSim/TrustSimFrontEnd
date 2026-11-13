"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import * as signalR from "@microsoft/signalr";
import { ArrowLeft, Check, CheckCheck, MessageCircle, Paperclip, Send, X } from "lucide-react";
import { authService } from "@/services/authService";
import { ensureFreshAccessToken } from "@/services/authSession";
import { getApiBaseUrl } from "@/services/apiConfig";
import { chatService, type ChatConversation, type ChatMessage } from "@/services/chatService";

type View = "all" | "support" | "direct" | "pending" | "mine";
const time = (date?: string) => date ? new Date(date).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "";

export default function ChatWorkspace({ staff = false, initialId, mode = "all" }: { staff?: boolean; initialId?: string; mode?: "all" | "direct" }) {
  const [user, setUser] = useState<ReturnType<typeof authService.getUser>>(null);
  const [authReady, setAuthReady] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState(initialId || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [view, setView] = useState<View>(staff ? "pending" : "all");
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(false);
  const [page, setPage] = useState(1);
  const messageListRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const restoreScrollRef = useRef<{ height: number; top: number } | null>(null);
  const hubRef = useRef<signalR.HubConnection | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  useEffect(() => { setUser(authService.getUser()); setAuthReady(true); }, []);

  const refreshList = useCallback(async () => {
    const result = await chatService.list(staff ? "SUPPORT" : mode === "direct" ? "DIRECT" : undefined);
    setConversations(result.items);
  }, [staff, mode]);

  const refreshMessages = useCallback(async (id: string, preserve = false) => {
    const result = await chatService.messages(id);
    const newest = [...result.items].reverse();
    setMessages((previous) => preserve ? [...previous.filter((message) => !result.items.some((fresh) => fresh.id === message.id)), ...newest] : newest);
    if (!preserve) { setHasOlder(result.hasNextPage); setPage(1); }
    void chatService.read(id).catch(() => {});
  }, []);

  useEffect(() => {
    let live = true;
    refreshList().catch((cause) => { if (live) setError(cause.message || "Không thể tải hội thoại"); })
      .finally(() => { if (live) setLoading(false); });
    const timer = window.setInterval(() => {
      void refreshList().catch(() => {});
      if (activeRef.current) void refreshMessages(activeRef.current, true).catch(() => {});
    }, 12000);
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/chat`, { accessTokenFactory: async () => (await ensureFreshAccessToken(60)) || "" })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();
    hubRef.current = hub;
    const sync = () => {
      void refreshList().catch(() => {});
      if (activeRef.current) void refreshMessages(activeRef.current, true).catch(() => {});
    };
    hub.on("ReceiveChatMessage", sync);
    hub.on("ReceiveConversationUpdated", sync);
    hub.on("ReceiveNewPendingSupportConversation", sync);
    hub.on("ReceiveSupportConversationClaimed", sync);
    hub.on("ReceiveMessagesRead", sync);
    hub.onreconnected(() => { if (activeRef.current) void hub.invoke("JoinConversation", activeRef.current).catch(() => {}); sync(); });
    void hub.start().then(() => { if (activeRef.current) return hub.invoke("JoinConversation", activeRef.current); }).catch(() => {});
    return () => { live = false; window.clearInterval(timer); hubRef.current = null; void hub.stop(); };
  }, [refreshList, refreshMessages]);

  useEffect(() => {
    if (!activeId) return;
    nearBottomRef.current = true;
    setError("");
    void refreshMessages(activeId).catch((cause) => setError(cause.message || "Không thể tải tin nhắn"));
    const hub = hubRef.current;
    if (hub?.state === signalR.HubConnectionState.Connected) void hub.invoke("JoinConversation", activeId).catch(() => {});
    return () => { if (hub?.state === signalR.HubConnectionState.Connected) void hub.invoke("LeaveConversation", activeId).catch(() => {}); };
  }, [activeId, refreshMessages]);

  useLayoutEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    if (restoreScrollRef.current) {
      const previous = restoreScrollRef.current;
      list.scrollTop = previous.top + list.scrollHeight - previous.height;
      restoreScrollRef.current = null;
    } else if (nearBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, activeId]);

  const selected = conversations.find((item) => item.id === activeId);
  const filtered = conversations.filter((item) => staff
    ? view === "pending" ? item.supportStatus === "PENDING" : item.supportStatus === "CLAIMED" || item.supportStatus === "RESOLVED"
    : mode === "direct" ? item.type === "DIRECT" : view === "support" ? item.type === "SUPPORT" : view === "direct" ? item.type === "DIRECT" : true);
  const mayReply = selected && (!staff || selected.supportStatus === "CLAIMED") && selected.supportStatus !== "RESOLVED";
  const canOpen = !staff || user?.role?.toUpperCase() === "ADMIN" || user?.role?.toUpperCase() === "CONSULTANT";

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await action(); await refreshList(); if (activeRef.current) await refreshMessages(activeRef.current, true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể thực hiện thao tác"); }
    finally { setBusy(false); }
  };

  if (!authReady) return <div className="p-8 text-center text-sm text-[#5b6477]">Đang tải hội thoại…</div>;
  if (!user) return <div className="p-8 text-center text-sm text-[#5b6477]">Vui lòng <Link className="font-semibold text-[#001743] underline" href="/login">đăng nhập</Link> để nhắn tin.</div>;
  if (!canOpen) return <div className="p-8 text-center text-sm text-[#5b6477]">Tài khoản không có quyền xử lý hội thoại hỗ trợ.</div>;

  return (
    <section className="relative mx-auto flex h-[min(780px,calc(100dvh-110px))] min-h-[480px] w-full max-w-[1320px] overflow-hidden rounded-xl border border-[#dfe5f2] bg-white/90 shadow-[0_16px_50px_rgba(0,23,67,.06)] backdrop-blur-xl">
      <aside className={`w-full shrink-0 border-r border-[#e4e9f4] md:w-[310px] ${activeId ? "hidden md:block" : "block"}`}>
        <div className="border-b border-[#e4e9f4] p-4">
          <div className="flex items-center justify-between gap-2"><h1 className="text-lg font-semibold tracking-tight text-[#001743]">{staff ? "Hộp thư hỗ trợ" : mode === "direct" ? "Tin nhắn giao dịch" : "Tin nhắn"}</h1>{!staff && mode !== "direct" && <button type="button" disabled={busy} onClick={() => run(async () => { const next = await chatService.support(); setActiveId(next.id); setView("all"); })} className="rounded-md bg-[#001743] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Yêu cầu hỗ trợ mới</button>}</div>
          {mode !== "direct" && <div className="mt-4 flex gap-4 border-b border-[#e4e9f4] text-xs font-semibold text-[#647089]">{(staff ? [["pending", "Chờ tiếp nhận"], ["mine", "Của tôi"]] : [["all", "Tất cả"], ["support", "TrustSim"], ["direct", "Giao dịch"]]).map(([key, label]) => <button key={key} type="button" onClick={() => setView(key as View)} className={`-mb-px border-b-2 pb-2 ${view === key ? "border-[#4c5fd5] text-[#001743]" : "border-transparent"}`}>{label}</button>)}</div>}
        </div>
        <div className="h-[calc(100%-105px)] overflow-y-auto">{loading ? <p className="p-5 text-sm text-[#98a1b3]">Đang tải…</p> : filtered.length === 0 ? <p className="p-5 text-sm text-[#98a1b3]">Chưa có hội thoại.</p> : filtered.map((item) => <button key={item.id} type="button" onClick={() => setActiveId(item.id)} className={`flex w-full gap-3 border-b border-[#edf0f7] px-4 py-4 text-left hover:bg-[#f4f6fc] ${item.id === activeId ? "bg-[#eef2ff]" : ""}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8edff] text-sm font-bold text-[#001743]">{item.displayTitle?.charAt(0) || "?"}</span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className="truncate text-sm text-[#001743]">{item.displayTitle}</strong><small className="shrink-0 text-[10px] text-[#98a1b3]">{time(item.lastMessageAt)}</small></span><span className="mt-1 block truncate text-xs text-[#5b6477]">{item.lastMessagePreview || (item.supportStatus === "PENDING" ? "Đang chờ tiếp nhận" : "Chưa có tin nhắn")}</span></span>{item.unreadCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#001743] px-1 text-[10px] font-bold text-white">{item.unreadCount}</span>}</button>)}</div>
      </aside>
      <div className={`flex min-w-0 flex-1 flex-col ${!activeId ? "hidden md:flex" : "flex"}`}>
        {!selected ? <div className="grid flex-1 place-items-center text-center text-sm text-[#98a1b3]"><div><MessageCircle className="mx-auto mb-3 text-[#8c9cff]" size={32} />Chọn một hội thoại để bắt đầu</div></div> : <>
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[#e4e9f4] px-4"><div className="flex min-w-0 items-center gap-2"><button type="button" className="md:hidden" aria-label="Quay lại danh sách" onClick={() => setActiveId("")}><ArrowLeft size={20} /></button><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-[#001743]">{selected.displayTitle}</h2><p className="text-xs text-[#748096]">{selected.type === "SUPPORT" ? selected.supportStatus === "PENDING" ? "Chờ tư vấn viên tiếp nhận" : selected.supportStatus === "RESOLVED" ? "Đã kết thúc" : "Hỗ trợ riêng tư" : "Hội thoại giữa hai bên"}</p></div></div><div className="flex gap-2">{staff && selected.canClaim && <button type="button" disabled={busy} onClick={() => run(() => chatService.claim(selected.id))} className="rounded-md bg-[#001743] px-3 py-2 text-xs font-semibold text-white">Tiếp nhận</button>}{selected.type === "SUPPORT" && selected.supportStatus === "CLAIMED" && <button type="button" disabled={busy} onClick={() => run(() => chatService.resolve(selected.id))} className="rounded-md border border-[#dfe5f2] px-3 py-2 text-xs font-semibold text-[#001743]">Kết thúc</button>}</div></header>
          <div ref={messageListRef} onScroll={(event) => { const list = event.currentTarget; nearBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 96; }} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f9faff,#fff)] p-4">{hasOlder && <button type="button" className="mx-auto block text-xs font-semibold text-[#4c5fd5]" onClick={async () => { setError(""); try { const next = await chatService.messages(selected.id, page + 1); const list = messageListRef.current; if (list) restoreScrollRef.current = { height: list.scrollHeight, top: list.scrollTop }; setMessages((prev) => [...next.items].reverse().concat(prev)); setPage(page + 1); setHasOlder(next.hasNextPage); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải tin nhắn cũ"); } }}>Tải tin nhắn cũ</button>}{messages.map((message) => { const mine = message.senderId.toLowerCase() === user.userId.toLowerCase(); return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[min(78%,520px)] rounded-xl px-3.5 py-2.5 text-sm ${mine ? "bg-[#001743] text-white" : "border border-[#e4e9f4] bg-white text-[#0b1630]"}`}><p className="whitespace-pre-wrap break-words">{message.content}</p>{message.attachmentUrl && (message.isAttachmentExpired ? <span className="mt-2 block text-xs opacity-70">Tệp đã hết hạn</span> : <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className={`mt-2 block break-all underline ${mine ? "text-[#dfe5ff]" : "text-[#4c5fd5]"}`}>{message.attachmentFileName || "Mở tệp đính kèm"}</a>)}<small className={`mt-1 block text-right text-[10px] ${mine ? "text-[#c7d0ff]" : "text-[#4c5fd5]"}`}>{time(message.createdDate)} {mine && (message.isRead ? <CheckCheck className="ml-1 inline" size={12} /> : <Check className="ml-1 inline" size={12} />)}</small></div></div>; })}</div>
          {mayReply ? <form onSubmit={(event) => { event.preventDefault(); if (!draft.trim() && !attachment) return; void run(async () => { await chatService.send(selected.id, draft, attachment || undefined); setDraft(""); setAttachment(null); }); }} className="border-t border-[#e4e9f4] p-3"><div className="flex items-end gap-2"><input ref={fileRef} type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} /><button type="button" aria-label="Đính kèm ảnh hoặc PDF" onClick={() => fileRef.current?.click()} className="grid h-10 w-10 place-items-center rounded-md text-[#52617b] hover:bg-[#f1f3ff]"><Paperclip size={18} /></button><textarea rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nhập tin nhắn…" className="max-h-28 min-h-10 flex-1 resize-none rounded-md border border-[#dfe5f2] px-3 py-2 text-sm outline-none focus:border-[#4c5fd5]" /><button type="submit" disabled={busy || (!draft.trim() && !attachment)} aria-label="Gửi tin nhắn" className="grid h-10 w-10 place-items-center rounded-md bg-[#001743] text-white disabled:opacity-40"><Send size={17} /></button></div>{attachment && <p className="mt-2 flex items-center gap-2 text-xs text-[#52617b]">{attachment.name}<button type="button" aria-label="Bỏ tệp đính kèm" onClick={() => setAttachment(null)}><X size={13} /></button></p>}</form> : <div className="border-t border-[#e4e9f4] p-4 text-center text-xs text-[#748096]">{selected.supportStatus === "PENDING" && staff ? "Tiếp nhận để trả lời khách hàng." : "Hội thoại đã kết thúc."}</div>}
        </>}
      </div>
      {error && <div role="alert" className="absolute bottom-4 right-4 max-w-sm rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800">{error}</div>}
    </section>
  );
}

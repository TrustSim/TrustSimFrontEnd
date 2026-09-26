"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  Square,
  RefreshCw,
  Minus,
  Maximize2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  streamChatConsultation,
  type ChatConsultationRequest,
  type ChatConsultationStreamEvent,
  type ConsultationSimSuggestion,
} from "@/services/aiConsultantService";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  toolStatus?: string;
  suggestedSims?: ConsultationSimSuggestion[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  {
    title: "Tư vấn SIM phong thủy",
    desc: "Hợp mệnh Kim, sinh năm 1990",
    prompt: "Tư vấn giúp tôi số SIM phong thủy hợp người mệnh Kim, sinh năm 1990, hỗ trợ kinh doanh buôn bán.",
  },
  {
    title: "Tìm SIM dưới 10 triệu",
    desc: "SIM Tam hoa, Lộc phát hoặc Thần tài",
    prompt: "Tôi có ngân sách từ 5 đến 10 triệu, cần tìm số SIM đẹp đuôi Tam hoa, Lộc phát hoặc Thần tài.",
  },
  {
    title: "Thẩm định giá số SIM",
    desc: "Định giá và phân tích thế số",
    prompt: "Hãy giúp tôi thẩm định giá và phân tích ý nghĩa số điện thoại 0988.888.888 trên thị trường hiện nay.",
  },
  {
    title: "Quy trình chuyển nhượng",
    desc: "Cơ chế ký quỹ & an toàn sàn",
    prompt: "Quy trình đấu giá và chuyển nhượng quyền sở hữu SIM chính chủ trên TrustSim diễn ra như thế nào?",
  },
];

export function AiConsultantChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Bộ lọc thông tin tùy chọn
  const [showFilters, setShowFilters] = useState(false);
  const [birthYear, setBirthYear] = useState<number | "">("");
  const [career, setCareer] = useState("");
  const [budgetMin, setBudgetMin] = useState<number | "">("");
  const [budgetMax, setBudgetMax] = useState<number | "">("");
  const [fengShuiElement, setFengShuiElement] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(isStreaming ? "auto" : "smooth");
  }, [messages, isStreaming, scrollToBottom]);

  // Lắng nghe sự kiện toàn cục để mở chat từ Navbar hoặc nơi khác
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      setIsMinimized(false);
      if (e.detail?.prompt) {
        setInputValue(e.detail.prompt);
      }
    };
    window.addEventListener("open_ai_chat", handleOpenChat);
    return () => window.removeEventListener("open_ai_chat", handleOpenChat);
  }, []);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming) return;

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsgId = "user-" + Date.now();
    const assistantMsgId = "ai-" + Date.now();
    const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    // 1. Thêm tin nhắn của User
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      content: text,
      timestamp: nowStr,
    };

    // 2. Thêm bong bóng trả lời ban đầu của AI (trạng thái streaming)
    const newAiMsg: ChatMessage = {
      id: assistantMsgId,
      sender: "assistant",
      content: "",
      isStreaming: true,
      timestamp: nowStr,
    };

    setMessages((prev) => [...prev, newUserMsg, newAiMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const request: ChatConsultationRequest = {
      sessionId: sessionId || undefined,
      message: text,
      userBirthYear: birthYear ? Number(birthYear) : undefined,
      userCareer: career.trim() || undefined,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      fengShuiElement: fengShuiElement || undefined,
    };

    try {
      await streamChatConsultation(
        request,
        (event: ChatConsultationStreamEvent) => {
          if (event.eventType === "session" && event.sessionId) {
            setSessionId(event.sessionId);
          }

          if (event.eventType === "tool_start") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, toolStatus: event.toolSummary || "Đang tra cứu dữ liệu..." }
                  : m
              )
            );
          }

          if (event.eventType === "tool_end") {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, toolStatus: undefined } : m))
            );
          }

          if (event.eventType === "token" && event.delta) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + event.delta, toolStatus: undefined }
                  : m
              )
            );
          }

          if (event.suggestedSims && event.suggestedSims.length > 0) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, suggestedSims: event.suggestedSims } : m
              )
            );
          }

          if (event.eventType === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        m.content +
                        (m.content ? "\n\n" : "") +
                        `*(Đã xảy ra lỗi: ${event.errorMessage || "Không thể tải phản hồi"})*`,
                      isStreaming: false,
                    }
                  : m
              )
            );
          }

          if (event.eventType === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false, toolStatus: undefined } : m
              )
            );
          }
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    m.content ||
                    `Xin lỗi, đã xảy ra lỗi khi kết nối với máy chủ AI (${err.message || "Vui lòng thử lại"}).`,
                  isStreaming: false,
                  toolStatus: undefined,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
      );
    }
  };

  // Dừng tạo phản hồi (Stop Generation)
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Làm mới cuộc trò chuyện
  const handleResetConversation = () => {
    handleStopStreaming();
    setSessionId(null);
    setMessages([]);
    setInputValue("");
  };

  // Tự động điều chỉnh chiều cao ô nhập liệu
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 120) + "px";
  };

  // Xử lý phím Enter / Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render nội dung văn bản với định dạng Markdown cơ bản
  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Bold text formatting: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={line.trim() === "" ? "h-2" : "min-h-[1.25rem] leading-relaxed my-0.5"}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-bold text-[#001743]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* ─── 1. NÚT NỔI CỐ ĐỊNH (FLOATING ACTION BUTTON) ─── */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] animate-fade-in group">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#001743] via-[#00266B] to-[#E4011E] text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 cursor-pointer"
            title="Mở Trợ lý AI TrustSim (Tư vấn SIM & Phong thủy)"
          >
            {/* Vòng sáng phát xung (Pulsing ring effect) */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-red-500 to-purple-600 opacity-60 blur-xs group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />

            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/15 backdrop-blur-xs shrink-0">
              <Sparkles size={16} className="text-amber-300 animate-spin-slow" />
            </div>

            <div className="relative flex flex-col text-left pr-1">
              <span className="text-[10px] text-amber-200 font-semibold uppercase tracking-wider leading-none">
                AI Chuyên Gia
              </span>
              <span className="text-xs font-black text-white mt-0.5 tracking-tight">
                Tư Vấn SIM Số
              </span>
            </div>

            {/* Chấm tròn báo trạng thái trực tuyến */}
            <span className="relative flex h-2.5 w-2.5 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </button>
        </div>
      )}

      {/* ─── 2. HỘP THOẠI CHAT (CHATBOT WINDOW) ─── */}
      {isOpen && (
        <div
          className={`fixed bottom-5 right-5 z-[1000] w-[420px] max-w-[calc(100vw-32px)] bg-white rounded-[20px] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-300 animate-fade-up ${
            isMinimized ? "h-[64px]" : "h-[620px] max-h-[85vh]"
          }`}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between p-3.5 px-4 bg-gradient-to-r from-[#001743] via-[#002266] to-[#0A2540] text-white shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Sparkles size={16} className="text-amber-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#001743] rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-extrabold text-white truncate m-0">
                    Trợ Lý AI TrustSim
                  </h3>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold">
                    Trực tuyến
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate mt-0.5">
                  Tư vấn SIM số đẹp, phong thủy &amp; định giá sàn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300 shrink-0">
              {/* Nút cài đặt bộ lọc (Năm sinh, mệnh, ngân sách) */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${
                  showFilters ? "text-amber-300 bg-white/15" : "hover:text-white"
                }`}
                title="Tùy chỉnh thông tin phong thủy & ngân sách"
              >
                <SlidersHorizontal size={14} />
              </button>

              {/* Nút Làm mới phiên */}
              <button
                type="button"
                onClick={handleResetConversation}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Tạo cuộc trò chuyện mới"
              >
                <RefreshCw size={14} />
              </button>

              {/* Nút Thu nhỏ / Mở rộng */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
              </button>

              {/* Nút Đóng */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                title="Đóng hội thoại"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Thân Chat: Chỉ hiển thị khi không bị thu nhỏ ── */}
          {!isMinimized && (
            <div className="flex flex-col flex-1 min-h-0 bg-[#F8FAFC]">
              {/* Thanh lọc bối cảnh (Collapsible Context Drawer) */}
              {showFilters && (
                <div className="p-3 bg-white border-b border-slate-200 text-xs space-y-2 animate-fadeIn shadow-xs shrink-0">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#001743]">
                    <span>Thông tin cá nhân hóa (Tùy chọn):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBirthYear("");
                        setCareer("");
                        setBudgetMin("");
                        setBudgetMax("");
                        setFengShuiElement("");
                      }}
                      className="text-slate-400 hover:text-rose-600 text-[10px] underline cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Năm sinh:</label>
                      <input
                        type="number"
                        placeholder="VD: 1990"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-[#001743]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Mệnh ngũ hành:</label>
                      <select
                        value={fengShuiElement}
                        onChange={(e) => setFengShuiElement(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-[#001743]"
                      >
                        <option value="">Tự động nhận diện</option>
                        <option value="Kim">Mệnh Kim</option>
                        <option value="Mộc">Mệnh Mộc</option>
                        <option value="Thủy">Mệnh Thủy</option>
                        <option value="Hỏa">Mệnh Hỏa</option>
                        <option value="Thổ">Mệnh Thổ</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Ngân sách từ (₫):</label>
                      <input
                        type="number"
                        placeholder="VD: 2000000"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-[#001743]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Ngân sách đến (₫):</label>
                      <input
                        type="number"
                        placeholder="VD: 10000000"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-[#001743]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vùng cuộn tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.length === 0 ? (
                  /* Màn hình khởi đầu với gợi ý nhanh */
                  <div className="py-3 space-y-4">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xs">
                        <Sparkles size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-[#001743] m-0">
                        Xin chào! Tôi có thể giúp gì cho bạn?
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Tôi là Trợ lý AI của TrustSim, sẵn sàng giải đáp về chọn SIM phong thủy, thẩm định giá thị trường và hướng dẫn tham gia đấu giá an toàn.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        Gợi ý câu hỏi nhanh:
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {QUICK_PROMPTS.map((qp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(qp.prompt)}
                            className="p-2.5 bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs"
                          >
                            <div className="font-bold text-[#001743] group-hover:text-blue-700 flex items-center justify-between text-xs">
                              <span>{qp.title}</span>
                              <Sparkles size={11} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                              {qp.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Danh sách tin nhắn hội thoại */
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.sender === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Sparkles size={13} />
                        </div>
                      )}

                      <div className={`max-w-[85%] space-y-2`}>
                        {/* Bong bóng tin nhắn */}
                        <div
                          className={`p-3 rounded-2xl shadow-2xs ${
                            msg.sender === "user"
                              ? "bg-[#001743] text-white rounded-tr-xs"
                              : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                          }`}
                        >
                          {/* Trạng thái thực thi công cụ (Tool Status) */}
                          {msg.toolStatus && (
                            <div className="mb-2 p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-[11px] font-semibold flex items-center gap-2 animate-pulse">
                              <RefreshCw size={11} className="animate-spin text-blue-600 shrink-0" />
                              <span>{msg.toolStatus}</span>
                            </div>
                          )}

                          {/* Nội dung chính */}
                          <div className="text-xs break-words">
                            {renderMessageContent(msg.content)}
                            {/* Con trỏ nhấp nháy khi đang stream */}
                            {msg.isStreaming && (
                              <span className="inline-block w-1.5 h-3.5 bg-[#E4011E] ml-1 align-middle animate-pulse" />
                            )}
                          </div>
                        </div>

                        {/* Danh sách thẻ SIM gợi ý (Suggested SIM Cards) */}
                        {msg.suggestedSims && msg.suggestedSims.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Flame size={12} className="text-[#E4011E]" />
                              <span>Số SIM đề xuất phù hợp:</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {msg.suggestedSims.map((sim, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-2.5 bg-white border border-blue-200/90 hover:border-blue-400 rounded-xl shadow-2xs transition-all flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <div className="font-extrabold text-[#001743] font-mono text-sm tracking-tight">
                                      {sim.phoneNumber}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-700">
                                        {sim.carrierName}
                                      </span>
                                      <span className="font-bold text-[#E4011E] font-mono">
                                        {sim.price?.toLocaleString("vi-VN")} ₫
                                      </span>
                                    </div>
                                    {sim.highlightReason && (
                                      <div className="text-[10px] text-slate-600 mt-1 italic line-clamp-1">
                                        {sim.highlightReason}
                                      </div>
                                    )}
                                  </div>

                                  <Link
                                    href="/auctions"
                                    className="p-1.5 px-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-lg text-[10.5px] font-bold transition-colors shrink-0 flex items-center gap-1"
                                  >
                                    <span>Xem</span>
                                    <ExternalLink size={10} />
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Thời gian */}
                        <div
                          className={`text-[9.5px] text-slate-400 ${
                            msg.sender === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>

                      {msg.sender === "user" && (
                        <div className="w-7 h-7 rounded-full bg-[#001743] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <User size={13} />
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Footer: Ô nhập liệu & Nút gửi ── */}
              <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="relative flex-1 bg-slate-100 focus-within:bg-white rounded-xl border border-slate-200 focus-within:border-[#001743] transition-colors">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleTextareaInput}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập câu hỏi tư vấn SIM, phong thủy..."
                      rows={1}
                      maxLength={2000}
                      disabled={isStreaming}
                      className="w-full text-xs p-2.5 pr-2 bg-transparent resize-none focus:outline-none max-h-[120px] text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStopStreaming}
                      className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                      title="Dừng tạo phản hồi"
                    >
                      <Square size={14} className="fill-white" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="p-2.5 rounded-xl bg-[#001743] hover:bg-[#00266B] disabled:opacity-40 disabled:hover:bg-[#001743] text-white shadow-xs transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                      title="Gửi tin nhắn (Enter)"
                    >
                      <Send size={14} />
                    </button>
                  )}
                </form>

                <div className="text-[9px] text-slate-400 text-center mt-1.5">
                  AI có thể đưa ra kết quả tham khảo. Nhấn <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[8px] font-mono">Enter</kbd> để gửi.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

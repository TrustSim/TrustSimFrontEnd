import * as signalR from "@microsoft/signalr";
import { authService } from "./authService";
import { ensureFreshAccessToken } from "./authSession";
import { NotificationItemDto } from "./notificationService";

const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "") + "/hubs/auction"
    : "http://localhost:5130/hubs/auction");

type NotificationCallback = (notification: NotificationItemDto) => void;
type UnreadCountCallback = (unreadCount: number) => void;

class NotificationHubService {
  private connection: signalR.HubConnection | null = null;
  private connectionPromise: Promise<signalR.HubConnection> | null = null;
  private notificationListeners: Set<NotificationCallback> = new Set();
  private unreadCountListeners: Set<UnreadCountCallback> = new Set();
  private currentSubscribedUserId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const handleAuthChange = () => {
        const user = authService.getUser();
        const newUserId = user?.userId;
        if (newUserId && newUserId !== this.currentSubscribedUserId) {
          this.joinPersonalFeed(newUserId).catch(() => {});
        } else if (!newUserId && this.currentSubscribedUserId) {
          this.leavePersonalFeed(this.currentSubscribedUserId).catch(() => {});
          this.currentSubscribedUserId = null;
        }
      };

      window.addEventListener("trustsim_auth_change", handleAuthChange);
      window.addEventListener("storage", handleAuthChange);
    }
  }

  /**
   * Khởi tạo kết nối WebSocket thời gian thực tới AuctionHub (/hubs/auction)
   */
  public async startConnection(): Promise<signalR.HubConnection> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        if (!this.connection) {
          this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
              accessTokenFactory: async () =>
                (await ensureFreshAccessToken(60)) || "",
              transport:
                signalR.HttpTransportType.WebSockets |
                signalR.HttpTransportType.LongPolling,
              withCredentials: true,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Information)
            .build();

          this.connection.onreconnecting((error) => {
            console.warn("[NotificationHub] Mất kết nối, đang tự động kết nối lại...", error);
          });

          this.connection.onreconnected(async (connectionId) => {
            console.log("[NotificationHub] Đã kết nối lại thành công:", connectionId);
            const user = authService.getUser();
            if (user?.userId) {
              await this.joinPersonalFeed(user.userId);
            }
          });

          this.connection.onclose((error) => {
            console.warn("[NotificationHub] Kết nối đã đóng:", error);
          });

          // Lắng nghe sự kiện thông báo cá nhân chính thức từ Backend AuctionRealtimeNotifier
          this.connection.on("ReceivePersonalNotification", (raw: any) => {
            const notif: NotificationItemDto = {
              id: String(raw.id || raw.Id || Date.now()),
              userId: String(raw.userId || raw.UserId || ""),
              title: raw.title || raw.Title || "Thông báo mới",
              content: raw.content || raw.Content || "",
              actionUrl: raw.actionUrl || raw.ActionUrl || null,
              isRead: Boolean(raw.isRead ?? raw.IsRead ?? false),
              createdDate: raw.createdDate || raw.CreatedDate || new Date().toISOString(),
            };
            this.notificationListeners.forEach((cb) => {
              try {
                cb(notif);
              } catch (e) {
                console.error("[NotificationHub] Lỗi thực thi callback ReceivePersonalNotification:", e);
              }
            });
          });

          // Lắng nghe sự kiện thông báo ReceiveNotification (dành cho backward compat)
          this.connection.on("ReceiveNotification", (notification: NotificationItemDto) => {
            this.notificationListeners.forEach((cb) => {
              try {
                cb(notification);
              } catch (e) {
                console.error("[NotificationHub] Lỗi thực thi callback ReceiveNotification:", e);
              }
            });
          });

          // Lắng nghe sự kiện cập nhật số lượng chưa đọc
          this.connection.on("ReceiveUnreadCount", (count: number) => {
            this.unreadCountListeners.forEach((cb) => {
              try {
                cb(count);
              } catch (e) {
                console.error("[NotificationHub] Lỗi thực thi callback ReceiveUnreadCount:", e);
              }
            });
          });
        }

        if (this.connection.state === signalR.HubConnectionState.Disconnected) {
          await this.connection.start();
          console.log("[NotificationHub] Kết nối WebSocket tới /hubs/auction thành công!");
        }

        // Tự động tham gia hòm thư cá nhân nếu người dùng đã đăng nhập
        const currentUser = authService.getUser();
        if (currentUser?.userId) {
          await this.joinPersonalFeed(currentUser.userId);
        }

        return this.connection;
      } catch (err) {
        console.error("[NotificationHub] Không thể khởi tạo kết nối:", err);
        throw err;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Tham gia phòng nhận thông báo cá nhân theo userId
   */
  public async joinPersonalFeed(userId: string): Promise<void> {
    if (!userId) return;
    try {
      const conn = await this.startConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke("JoinPersonalNotificationFeed", userId);
        this.currentSubscribedUserId = userId;
        console.log(`[NotificationHub] Đã tham gia hòm thư cá nhân: user_${userId}`);
      }
    } catch (err) {
      console.warn(`[NotificationHub] Lỗi khi tham gia feed user_${userId}:`, err);
    }
  }

  /**
   * Rời phòng nhận thông báo cá nhân
   */
  public async leavePersonalFeed(userId: string): Promise<void> {
    if (!userId || !this.connection) return;
    try {
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("LeavePersonalNotificationFeed", userId);
        console.log(`[NotificationHub] Đã rời hòm thư cá nhân: user_${userId}`);
      }
    } catch (err) {
      console.warn(`[NotificationHub] Lỗi khi rời feed user_${userId}:`, err);
    }
  }

  /**
   * Đăng ký lắng nghe thông báo mới
   */
  public subscribeNotification(callback: NotificationCallback): () => void {
    this.notificationListeners.add(callback);
    this.startConnection().catch(() => {});
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  /**
   * Đăng ký lắng nghe cập nhật số lượng chưa đọc
   */
  public subscribeUnreadCount(callback: UnreadCountCallback): () => void {
    this.unreadCountListeners.add(callback);
    this.startConnection().catch(() => {});
    return () => {
      this.unreadCountListeners.delete(callback);
    };
  }

  /**
   * Đóng kết nối nếu cần
   */
  public async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.currentSubscribedUserId = null;
    }
  }
}

export const notificationHubService = new NotificationHubService();

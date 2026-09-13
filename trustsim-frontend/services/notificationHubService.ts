import * as signalR from "@microsoft/signalr";
import { authService } from "./authService";
import { NotificationItemDto } from "./notificationService";

const HUB_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "") + "/hubs/notifications"
    : "http://localhost:5130/hubs/notifications");

type NotificationCallback = (notification: NotificationItemDto) => void;
type UnreadCountCallback = (unreadCount: number) => void;

class NotificationHubService {
  private connection: signalR.HubConnection | null = null;
  private connectionPromise: Promise<signalR.HubConnection> | null = null;
  private notificationListeners: Set<NotificationCallback> = new Set();
  private unreadCountListeners: Set<UnreadCountCallback> = new Set();

  /**
   * Khởi tạo kết nối WebSocket thời gian thực tới NotificationHub
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
              accessTokenFactory: () => authService.getToken() || "",
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

          this.connection.onreconnected((connectionId) => {
            console.log("[NotificationHub] Đã kết nối lại thành công:", connectionId);
          });

          this.connection.onclose((error) => {
            console.warn("[NotificationHub] Kết nối đã đóng:", error);
          });

          // Lắng nghe sự kiện thông báo mới từ server
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
          console.log("[NotificationHub] Kết nối WebSocket tới NotificationHub thành công!");
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
    }
  }
}

export const notificationHubService = new NotificationHubService();

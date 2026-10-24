import * as signalR from "@microsoft/signalr";
import { authService } from "./authService";
import { ensureFreshAccessToken } from "./authSession";
import { BidDto, AuctionDto } from "./auctionService";

const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "") + "/hubs/auction"
    : "http://localhost:5130/hubs/auction");

class AuctionHubService {
  private connection: signalR.HubConnection | null = null;
  private currentAuctionId: string | null = null;
  private joinedAuctionId: string | null = null;
  private inListingFeed: boolean = false;
  private connectionPromise: Promise<signalR.HubConnection> | null = null;

  /**
   * Đảm bảo đối tượng HubConnection luôn được tạo đồng bộ
   */
  private getConnection(): signalR.HubConnection {
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
        console.warn("[SignalR] Mất kết nối, đang tự động kết nối lại...", error);
        this.joinedAuctionId = null;
      });

      this.connection.onreconnected(async (connectionId) => {
        console.log("[SignalR] Đã kết nối lại thành công:", connectionId);
        // Tự động tham gia lại phòng đấu giá và bảng tin danh sách
        if (this.currentAuctionId) {
          await this.invokeJoinAuction(this.currentAuctionId);
        }
        if (this.inListingFeed) {
          await this.invokeJoinListingFeed();
        }
      });

      this.connection.onclose((error) => {
        console.warn("[SignalR] Kết nối đã đóng:", error);
        this.joinedAuctionId = null;
      });
    }
    return this.connection;
  }

  /**
   * Khởi tạo và duy trì kết nối WebSocket thời gian thực tới AuctionHub
   */
  public async startConnection(): Promise<signalR.HubConnection> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      return conn;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        // Nếu đang trong quá trình Connecting hoặc Reconnecting, chờ chuyển trạng thái
        if (
          conn.state === signalR.HubConnectionState.Connecting ||
          conn.state === signalR.HubConnectionState.Reconnecting
        ) {
          let waitCount = 0;
          while (
            (conn.state === signalR.HubConnectionState.Connecting ||
              conn.state === signalR.HubConnectionState.Reconnecting) &&
            waitCount < 40
          ) {
            await new Promise((r) => setTimeout(r, 100));
            waitCount++;
          }
        }

        if (conn.state === signalR.HubConnectionState.Disconnected) {
          await conn.start();
          console.log("[SignalR] Kết nối WebSocket tới AuctionHub thành công!");
        }

        return conn;
      } catch (err) {
        console.error("[SignalR] Không thể khởi tạo kết nối:", err);
        throw err;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Thực hiện gọi JoinAuctionGroup trên server
   */
  private async invokeJoinAuction(cleanAuctionId: string) {
    try {
      const conn = await this.startConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke("JoinAuctionGroup", cleanAuctionId);
        this.joinedAuctionId = cleanAuctionId;
        console.log(`[SignalR] Đã tham gia phòng đấu giá: auction_${cleanAuctionId}`);
      }
    } catch (err) {
      console.warn(`[SignalR] Lỗi khi tham gia phòng auction_${cleanAuctionId}:`, err);
    }
  }

  /**
   * Thực hiện gọi JoinListingFeed trên server
   */
  private async invokeJoinListingFeed() {
    try {
      const conn = await this.startConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke("JoinListingFeed");
        console.log("[SignalR] Đã tham gia kênh auctions_listing");
      }
    } catch (err) {
      console.warn("[SignalR] Lỗi khi tham gia kênh auctions_listing:", err);
    }
  }

  /**
   * Tham gia phòng theo dõi phiên đấu giá cụ thể
   */
  public async joinAuction(auctionId: string) {
    if (!auctionId) return;
    const cleanId = auctionId.trim().toLowerCase();
    this.currentAuctionId = cleanId;

    if (
      this.joinedAuctionId === cleanId &&
      this.connection?.state === signalR.HubConnectionState.Connected
    ) {
      return;
    }

    await this.invokeJoinAuction(cleanId);
  }

  /**
   * Rời phòng theo dõi phiên đấu giá
   */
  public async leaveAuction(auctionId: string) {
    if (!auctionId) return;
    const cleanId = auctionId.trim().toLowerCase();

    // Nếu người dùng đã chuyển sang auction khác hoặc đã rời, tránh ngắt auction mới
    if (this.currentAuctionId && this.currentAuctionId !== cleanId) {
      return;
    }

    this.currentAuctionId = null;
    this.joinedAuctionId = null;

    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("LeaveAuctionGroup", cleanId);
        console.log(`[SignalR] Đã rời phòng đấu giá: auction_${cleanId}`);
      }
    } catch (err) {
      console.warn(`[SignalR] Lỗi khi rời phòng auction_${cleanId}:`, err);
    }
  }

  /**
   * Tham gia kênh cập nhật danh sách đấu giá (/auctions)
   */
  public async joinListingFeed() {
    this.inListingFeed = true;
    await this.invokeJoinListingFeed();
  }

  /**
   * Rời kênh danh sách
   */
  public async leaveListingFeed() {
    this.inListingFeed = false;
    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("LeaveListingFeed");
      }
    } catch (err) {
      console.warn("[SignalR] Lỗi khi rời kênh auctions_listing:", err);
    }
  }

  /**
   * Đăng ký lắng nghe sự kiện lượt trả giá mới
   */
  public onNewBid(callback: (bid: BidDto, newCurrentPrice: number, totalBids: number) => void) {
    const conn = this.getConnection();
    conn.off("ReceiveNewBid");
    conn.on("ReceiveNewBid", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện gia hạn Anti-Sniping
   */
  public onAuctionExtended(callback: (newEndAt: string, extensionSeconds: number) => void) {
    const conn = this.getConnection();
    conn.off("ReceiveAuctionExtended");
    conn.on("ReceiveAuctionExtended", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện thay đổi trạng thái phiên
   */
  public onAuctionStatusChanged(
    callback: (auctionId: string, status: string, winnerId?: string, finalPrice?: number) => void
  ) {
    const conn = this.getConnection();
    conn.off("ReceiveAuctionStatusChanged");
    conn.on("ReceiveAuctionStatusChanged", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện phiên kết thúc và có kết quả quyết toán
   */
  public onAuctionEnded(callback: (result: any) => void) {
    const conn = this.getConnection();
    conn.off("ReceiveAuctionEnded");
    conn.on("ReceiveAuctionEnded", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện phiên thất bại/hủy
   */
  public onAuctionFailed(callback: (reason: string) => void) {
    const conn = this.getConnection();
    conn.off("ReceiveAuctionFailed");
    conn.on("ReceiveAuctionFailed", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện thông báo chung trong phiên
   */
  public onAuctionNotification(callback: (message: string, type: string) => void) {
    const conn = this.getConnection();
    conn.off("ReceiveAuctionNotification");
    conn.on("ReceiveAuctionNotification", callback);
  }

  /**
   * Đăng ký lắng nghe khi có phiên đấu giá mới được tạo
   */
  public onNewAuctionCreated(callback: (auction: AuctionDto) => void) {
    const conn = this.getConnection();
    conn.off("ReceiveNewAuctionCreated");
    conn.on("ReceiveNewAuctionCreated", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện giảm giá định kỳ trong đấu giá Hà Lan
   */
  public onPriceDrop(callback: (newPrice: number, nextDropSeconds: number) => void) {
    const conn = this.getConnection();
    conn.off("ReceivePriceDrop");
    conn.on("ReceivePriceDrop", callback);
  }

  /**
   * Xóa toàn bộ listeners của phòng đấu giá
   */
  public removeAuctionListeners() {
    if (!this.connection) return;
    this.connection.off("ReceiveNewBid");
    this.connection.off("ReceiveAuctionExtended");
    this.connection.off("ReceiveAuctionStatusChanged");
    this.connection.off("ReceiveAuctionEnded");
    this.connection.off("ReceiveAuctionFailed");
    this.connection.off("ReceiveAuctionNotification");
    this.connection.off("ReceivePriceDrop");
  }

  /**
   * Xóa listeners của trang danh sách
   */
  public removeListingListeners() {
    if (!this.connection) return;
    this.connection.off("ReceiveNewAuctionCreated");
  }

  /**
   * Đóng hoàn toàn kết nối WebSocket
   */
  public async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // Bỏ qua lỗi ngắt kết nối
      } finally {
        this.connection = null;
        this.currentAuctionId = null;
        this.joinedAuctionId = null;
        this.inListingFeed = false;
      }
    }
  }
}

export const auctionHubService = new AuctionHubService();

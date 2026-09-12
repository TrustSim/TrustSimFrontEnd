import * as signalR from "@microsoft/signalr";
import { authService } from "./authService";
import { BidDto, AuctionDto } from "./auctionService";

const HUB_URL =
  process.env.NEXT_PUBLIC_HUB_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "") + "/hubs/auction"
    : "http://localhost:5130/hubs/auction");

class AuctionHubService {
  private connection: signalR.HubConnection | null = null;
  private currentAuctionId: string | null = null;
  private inListingFeed: boolean = false;
  private connectionPromise: Promise<signalR.HubConnection> | null = null;

  /**
   * Khởi tạo và duy trì kết nối WebSocket thời gian thực tới AuctionHub
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
            console.warn("[SignalR] Mất kết nối, đang tự động kết nối lại...", error);
          });

          this.connection.onreconnected(async (connectionId) => {
            console.log("[SignalR] Đã kết nối lại thành công:", connectionId);
            // Tự động tham gia lại phòng đấu giá và bảng tin danh sách
            if (this.currentAuctionId) {
              await this.joinAuction(this.currentAuctionId);
            }
            if (this.inListingFeed) {
              await this.joinListingFeed();
            }
          });

          this.connection.onclose((error) => {
            console.warn("[SignalR] Kết nối đã đóng:", error);
          });
        }

        if (this.connection.state === signalR.HubConnectionState.Disconnected) {
          await this.connection.start();
          console.log("[SignalR] Kết nối WebSocket tới AuctionHub thành công!");
        }

        return this.connection;
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
   * Tham gia phòng theo dõi phiên đấu giá cụ thể
   */
  public async joinAuction(auctionId: string) {
    this.currentAuctionId = auctionId;
    try {
      const conn = await this.startConnection();
      if (conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke("JoinAuctionGroup", auctionId);
        console.log(`[SignalR] Đã tham gia phòng đấu giá: auction_${auctionId}`);
      }
    } catch (err) {
      console.warn(`[SignalR] Lỗi khi tham gia phòng auction_${auctionId}:`, err);
    }
  }

  /**
   * Rời phòng theo dõi phiên đấu giá
   */
  public async leaveAuction(auctionId: string) {
    try {
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke("LeaveAuctionGroup", auctionId);
        console.log(`[SignalR] Đã rời phòng đấu giá: auction_${auctionId}`);
      }
    } catch (err) {
      console.warn(`[SignalR] Lỗi khi rời phòng auction_${auctionId}:`, err);
    } finally {
      if (this.currentAuctionId === auctionId) {
        this.currentAuctionId = null;
      }
    }
  }

  /**
   * Tham gia kênh cập nhật danh sách đấu giá (/auctions)
   */
  public async joinListingFeed() {
    this.inListingFeed = true;
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
    if (!this.connection) return;
    this.connection.off("ReceiveNewBid");
    this.connection.on("ReceiveNewBid", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện gia hạn Anti-Sniping
   */
  public onAuctionExtended(callback: (newEndAt: string, extensionSeconds: number) => void) {
    if (!this.connection) return;
    this.connection.off("ReceiveAuctionExtended");
    this.connection.on("ReceiveAuctionExtended", callback);
  }

  /**
   * Đăng ký lắng nghe sự kiện thay đổi trạng thái phiên
   */
  public onAuctionStatusChanged(
    callback: (auctionId: string, status: string, winnerId?: string, finalPrice?: number) => void
  ) {
    if (!this.connection) return;
    this.connection.off("ReceiveAuctionStatusChanged");
    this.connection.on("ReceiveAuctionStatusChanged", callback);
  }

  /**
   * Đăng ký lắng nghe khi có phiên đấu giá mới được tạo
   */
  public onNewAuctionCreated(callback: (auction: AuctionDto) => void) {
    if (!this.connection) return;
    this.connection.off("ReceiveNewAuctionCreated");
    this.connection.on("ReceiveNewAuctionCreated", callback);
  }

  /**
   * Xóa toàn bộ listeners của phòng đấu giá
   */
  public removeAuctionListeners() {
    if (!this.connection) return;
    this.connection.off("ReceiveNewBid");
    this.connection.off("ReceiveAuctionExtended");
    this.connection.off("ReceiveAuctionStatusChanged");
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
        this.inListingFeed = false;
      }
    }
  }
}

export const auctionHubService = new AuctionHubService();

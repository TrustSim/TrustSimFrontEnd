export type ProfileTab =
  | "overview"
  | "ekyc"
  | "auctions"
  | "bids"
  | "transactions"
  | "contracts"
  | "settings";

export interface OwnedSim {
  id: string;
  simNumber: string;
  carrier: string;
  carrierLogo?: string;
  carrierCode?: string;
  simType: "Trả trước" | "Trả sau";
  acquiredFrom: "PLATFORM_AUCTION" | "PERSONAL_IMPORT";
  ownershipStatus: "VERIFIED_OWNER" | "UNVERIFIED";
  estimatedValue: number;
  createdDate: string;
  hasActiveAuction?: boolean;
  activeAuctionId?: string;
  formatRhythmName?: string;
}

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CONCLUDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WishlistItemType" AS ENUM ('SPECIFIC_CARD', 'FILTER');

-- CreateTable
CREATE TABLE "trades" (
    "id" UUID NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "linkedWishlistId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_items" (
    "id" UUID NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "offeredTradeId" UUID,
    "requestedTradeId" UUID,

    CONSTRAINT "trade_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_proposals" (
    "id" UUID NOT NULL,
    "tradeId" UUID NOT NULL,
    "proposerId" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" UUID NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "proposalId" UUID NOT NULL,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "wishlistId" UUID NOT NULL,
    "itemType" "WishlistItemType" NOT NULL,
    "cardId" TEXT,
    "filterType" TEXT,
    "filterRarity" TEXT,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trades_ownerId_idx" ON "trades"("ownerId");

-- CreateIndex
CREATE INDEX "trades_status_idx" ON "trades"("status");

-- CreateIndex
CREATE INDEX "trades_linkedWishlistId_idx" ON "trades"("linkedWishlistId");

-- CreateIndex
CREATE INDEX "trade_items_cardId_idx" ON "trade_items"("cardId");

-- CreateIndex
CREATE INDEX "trade_items_offeredTradeId_idx" ON "trade_items"("offeredTradeId");

-- CreateIndex
CREATE INDEX "trade_items_requestedTradeId_idx" ON "trade_items"("requestedTradeId");

-- CreateIndex
CREATE INDEX "trade_proposals_tradeId_idx" ON "trade_proposals"("tradeId");

-- CreateIndex
CREATE INDEX "trade_proposals_proposerId_idx" ON "trade_proposals"("proposerId");

-- CreateIndex
CREATE INDEX "trade_proposals_status_idx" ON "trade_proposals"("status");

-- CreateIndex
CREATE INDEX "proposal_items_proposalId_idx" ON "proposal_items"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_items_cardId_idx" ON "proposal_items"("cardId");

-- CreateIndex
CREATE INDEX "wishlists_userId_idx" ON "wishlists"("userId");

-- CreateIndex
CREATE INDEX "wishlist_items_wishlistId_idx" ON "wishlist_items"("wishlistId");

-- CreateIndex
CREATE INDEX "wishlist_items_itemType_idx" ON "wishlist_items"("itemType");

-- CreateIndex
CREATE INDEX "wishlist_items_cardId_idx" ON "wishlist_items"("cardId");

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_linkedWishlistId_fkey" FOREIGN KEY ("linkedWishlistId") REFERENCES "wishlists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_offeredTradeId_fkey" FOREIGN KEY ("offeredTradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_requestedTradeId_fkey" FOREIGN KEY ("requestedTradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "trade_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

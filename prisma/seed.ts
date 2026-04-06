import {
  PrismaClient,
  ProposalStatus,
  TradeStatus,
  WishlistItemType,
} from '@prisma/client';

const prisma = new PrismaClient();

const ids = {
  wishlists: {
    ash: '11111111-1111-4111-8111-111111111111',
    misty: '22222222-2222-4222-8222-222222222222',
  },
  wishlistItems: {
    ashSpecific: '11111111-1111-4111-8111-aaaaaaaaaaa1',
    ashFilter: '11111111-1111-4111-8111-aaaaaaaaaaa2',
    mistySpecific: '22222222-2222-4222-8222-bbbbbbbbbbb1',
    mistyFilter: '22222222-2222-4222-8222-bbbbbbbbbbb2',
  },
  trades: {
    open: '33333333-3333-4333-8333-333333333333',
    concluded: '44444444-4444-4444-8444-444444444444',
    cancelled: '55555555-5555-4555-8555-555555555555',
  },
  tradeItems: {
    openOfferedPikachu: '33333333-3333-4333-8333-aaaaaaaaaaa1',
    openOfferedSnorlax: '33333333-3333-4333-8333-aaaaaaaaaaa2',
    openRequestedBlastoise: '33333333-3333-4333-8333-aaaaaaaaaaa3',
    concludedOfferedSquirtle: '44444444-4444-4444-8444-bbbbbbbbbbb1',
    concludedRequestedBulbasaur: '44444444-4444-4444-8444-bbbbbbbbbbb2',
    concludedRequestedEevee: '44444444-4444-4444-8444-bbbbbbbbbbb3',
    cancelledOfferedDragonite: '55555555-5555-4555-8555-ccccccccccc1',
    cancelledRequestedGengar: '55555555-5555-4555-8555-ccccccccccc2',
  },
  proposals: {
    pending: '66666666-6666-4666-8666-666666666666',
    rejected: '77777777-7777-4777-8777-777777777777',
    accepted: '88888888-8888-4888-8888-888888888888',
    cancelled: '99999999-9999-4999-8999-999999999999',
  },
  proposalItems: {
    pendingBlastoise: '66666666-6666-4666-8666-aaaaaaaaaaa1',
    rejectedVenusaur: '77777777-7777-4777-8777-bbbbbbbbbbb1',
    acceptedBulbasaur: '88888888-8888-4888-8888-ccccccccccc1',
    acceptedEevee: '88888888-8888-4888-8888-ccccccccccc2',
    cancelledGengar: '99999999-9999-4999-8999-ddddddddddd1',
  },
};

async function main() {
  await prisma.proposalItem.deleteMany();
  await prisma.tradeProposal.deleteMany();
  await prisma.tradeItem.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();

  await prisma.wishlist.create({
    data: {
      id: ids.wishlists.ash,
      userId: 'user-ash',
      name: 'Kanto Chase',
      items: {
        create: [
          {
            id: ids.wishlistItems.ashSpecific,
            itemType: WishlistItemType.SPECIFIC_CARD,
            cardId: 'card-charizard-base-set',
          },
          {
            id: ids.wishlistItems.ashFilter,
            itemType: WishlistItemType.FILTER,
            filterType: 'pokemon',
            filterRarity: 'holo',
          },
        ],
      },
    },
  });

  await prisma.wishlist.create({
    data: {
      id: ids.wishlists.misty,
      userId: 'user-misty',
      name: 'Water Deck Upgrades',
      items: {
        create: [
          {
            id: ids.wishlistItems.mistySpecific,
            itemType: WishlistItemType.SPECIFIC_CARD,
            cardId: 'card-blastoise-base-set',
          },
          {
            id: ids.wishlistItems.mistyFilter,
            itemType: WishlistItemType.FILTER,
            filterType: 'energy',
            filterRarity: 'rare',
          },
        ],
      },
    },
  });

  await prisma.trade.create({
    data: {
      id: ids.trades.open,
      ownerId: 'user-ash',
      status: TradeStatus.OPEN,
      linkedWishlist: {
        connect: { id: ids.wishlists.ash },
      },
      offeredCards: {
        create: [
          {
            id: ids.tradeItems.openOfferedPikachu,
            cardId: 'card-pikachu-jungle',
            quantity: 1,
          },
          {
            id: ids.tradeItems.openOfferedSnorlax,
            cardId: 'card-snorlax-jungle',
            quantity: 1,
          },
        ],
      },
      requestedCards: {
        create: [
          {
            id: ids.tradeItems.openRequestedBlastoise,
            cardId: 'card-blastoise-base-set',
            quantity: 1,
          },
        ],
      },
      proposals: {
        create: [
          {
            id: ids.proposals.pending,
            proposerId: 'user-misty',
            status: ProposalStatus.PENDING,
            message: 'Posso oferecer uma Blastoise em bom estado.',
            offeredCards: {
              create: [
                {
                  id: ids.proposalItems.pendingBlastoise,
                  cardId: 'card-blastoise-base-set',
                  quantity: 1,
                },
              ],
            },
          },
          {
            id: ids.proposals.rejected,
            proposerId: 'user-gary',
            status: ProposalStatus.REJECTED,
            message: 'Tenho uma Venusaur, mas sem o brilho que voce pediu.',
            offeredCards: {
              create: [
                {
                  id: ids.proposalItems.rejectedVenusaur,
                  cardId: 'card-venusaur-base-set',
                  quantity: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.trade.create({
    data: {
      id: ids.trades.concluded,
      ownerId: 'user-misty',
      status: TradeStatus.CONCLUDED,
      offeredCards: {
        create: [
          {
            id: ids.tradeItems.concludedOfferedSquirtle,
            cardId: 'card-squirtle-team-up',
            quantity: 2,
          },
        ],
      },
      requestedCards: {
        create: [
          {
            id: ids.tradeItems.concludedRequestedBulbasaur,
            cardId: 'card-bulbasaur-base-set',
            quantity: 2,
          },
          {
            id: ids.tradeItems.concludedRequestedEevee,
            cardId: 'card-eevee-jungle',
            quantity: 1,
          },
        ],
      },
      proposals: {
        create: [
          {
            id: ids.proposals.accepted,
            proposerId: 'user-brock',
            status: ProposalStatus.ACCEPTED,
            message: 'Fechamos essa troca na liga de sabado.',
            offeredCards: {
              create: [
                {
                  id: ids.proposalItems.acceptedBulbasaur,
                  cardId: 'card-bulbasaur-base-set',
                  quantity: 2,
                },
                {
                  id: ids.proposalItems.acceptedEevee,
                  cardId: 'card-eevee-jungle',
                  quantity: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.trade.create({
    data: {
      id: ids.trades.cancelled,
      ownerId: 'user-brock',
      status: TradeStatus.CANCELLED,
      linkedWishlist: {
        connect: { id: ids.wishlists.misty },
      },
      offeredCards: {
        create: [
          {
            id: ids.tradeItems.cancelledOfferedDragonite,
            cardId: 'card-dragonite-fossil',
            quantity: 1,
          },
        ],
      },
      requestedCards: {
        create: [
          {
            id: ids.tradeItems.cancelledRequestedGengar,
            cardId: 'card-gengar-fossil',
            quantity: 1,
          },
        ],
      },
      proposals: {
        create: [
          {
            id: ids.proposals.cancelled,
            proposerId: 'user-erika',
            status: ProposalStatus.CANCELLED,
            message: 'Desisti porque consegui essa carta em outro trade.',
            offeredCards: {
              create: [
                {
                  id: ids.proposalItems.cancelledGengar,
                  cardId: 'card-gengar-fossil',
                  quantity: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const [wishlistCount, tradeCount, proposalCount] = await prisma.$transaction([
    prisma.wishlist.count(),
    prisma.trade.count(),
    prisma.tradeProposal.count(),
  ]);

  console.log(
    `Seed concluido com ${wishlistCount} wishlists, ${tradeCount} trades e ${proposalCount} proposals.`,
  );
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

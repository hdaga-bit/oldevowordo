function getEventRunId(room) {
  return room?.meta?.eventRunId || null;
}

function eventMeta(room) {
  if (!room?.meta?.isEvent) return null;
  const eventRunId = getEventRunId(room);
  if (!eventRunId) return null;
  return {
    eventRunId,
    eventKey: room.meta.eventKey || null,
    eventId: room.meta.eventId || null,
    roomId: room.id,
  };
}

function activeEventPlayerCount(room) {
  return Object.values(room?.players || {}).filter((player) => !player?.disconnected).length;
}

export function isEventRoom(room) {
  return Boolean(eventMeta(room));
}

export async function recordEventParticipationJoin(prisma, room, playerId) {
  const meta = eventMeta(room);
  if (!meta || !playerId) return;
  const player = room.players?.[playerId];
  if (!player) return;
  const now = new Date();

  await prisma.eventParticipation.upsert({
    where: {
      eventRunId_playerId: {
        eventRunId: meta.eventRunId,
        playerId,
      },
    },
    create: {
      eventRunId: meta.eventRunId,
      userId: player.userId || null,
      playerId,
      roomId: room.id,
      displayNameSnapshot: player.name || null,
      joinedAt: now,
      lastActiveAt: now,
      meta: {
        profileAvatar: player.profileAvatar || null,
        isReconnect: false,
      },
    },
    update: {
      userId: player.userId || null,
      roomId: room.id,
      displayNameSnapshot: player.name || null,
      leftAt: null,
      sessionDurationMs: null,
      lastActiveAt: now,
    },
  });

  const activeCount = activeEventPlayerCount(room);
  const count = await prisma.eventParticipation.count({
    where: { eventRunId: meta.eventRunId },
  });
  const run = await prisma.eventRun.findUnique({
    where: { id: meta.eventRunId },
    select: { peakConcurrentPlayers: true },
  });
  await prisma.eventRun.update({
    where: { id: meta.eventRunId },
    data: {
      uniqueParticipants: count,
      peakConcurrentPlayers: Math.max(run?.peakConcurrentPlayers || 0, activeCount),
    },
  });

  await prisma.event.create({
    data: {
      userId: player.userId || null,
      roomId: room.id,
      type: "event_player_joined",
      meta: { ...meta, playerId },
    },
  }).catch(() => {});
}

export async function recordEventParticipationLeave(
  prisma,
  room,
  playerId,
  { disconnected = false } = {},
) {
  const meta = eventMeta(room);
  if (!meta || !playerId) return;
  const now = new Date();
  const participation = await prisma.eventParticipation.findUnique({
    where: {
      eventRunId_playerId: {
        eventRunId: meta.eventRunId,
        playerId,
      },
    },
  });
  if (!participation) return;

  const sessionDurationMs = Math.max(0, now.getTime() - participation.joinedAt.getTime());
  await prisma.eventParticipation.update({
    where: { id: participation.id },
    data: {
      leftAt: now,
      sessionDurationMs,
      lastActiveAt: now,
      disconnects: disconnected ? { increment: 1 } : undefined,
    },
  });

  await prisma.event.create({
    data: {
      userId: participation.userId,
      roomId: room.id,
      type: disconnected ? "event_player_disconnected" : "event_player_left",
      meta: { ...meta, playerId, sessionDurationMs },
    },
  }).catch(() => {});
}

export async function recordEventMatchCompleted(prisma, room, { winnerId = null } = {}) {
  const meta = eventMeta(room);
  if (!meta) return;
  const now = new Date();
  const playerIds = Object.keys(room.players || {}).filter((pid) => pid !== room.hostId);
  for (const playerId of playerIds) {
    const participation = await prisma.eventParticipation.findUnique({
      where: {
        eventRunId_playerId: {
          eventRunId: meta.eventRunId,
          playerId,
        },
      },
    });
    if (!participation) continue;
    await prisma.eventParticipation.update({
      where: { id: participation.id },
      data: {
        matchesPlayed: { increment: 1 },
        wins: winnerId === playerId ? { increment: 1 } : undefined,
        losses: winnerId && winnerId !== playerId ? { increment: 1 } : undefined,
        lastActiveAt: now,
      },
    });
  }
  await prisma.eventRun.update({
    where: { id: meta.eventRunId },
    data: {
      matchCount: { increment: 1 },
      completedMatchCount: { increment: 1 },
    },
  }).catch(() => {});
  await prisma.event.create({
    data: {
      userId: room.players?.[winnerId]?.userId || null,
      roomId: room.id,
      type: "event_match_completed",
      meta: { ...meta, winnerId },
    },
  }).catch(() => {});
}

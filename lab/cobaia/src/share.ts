// Compartilhamento de documento por link com validade.

export interface Doc { id: string; ownerId: string; title: string; content: string }
export interface Share { token: string; docId: string; createdAt: number; ttlMs: number; revoked: boolean }
export interface PublicDoc { title: string; content: string }

export const TTL: Record<string, number> = {
  "1h": 3_600_000,
  "24h": 86_400_000,
  "7d": 604_800_000,
};

export class NotFound extends Error {}
export class Invalid extends Error {}

export class Store {
  docs = new Map<string, Doc>();
  shares = new Map<string, Share>();
}

export function isLinkValid(share: Share, now: number): boolean {
  if (share.revoked) return false;
  if (now < share.createdAt) return false;
  return now - share.createdAt < share.ttlMs;
}

export class ShareService {
  #seq = 0;
  constructor(
    private store: Store,
    private clock: () => number = Date.now,
    private newToken: () => string = () => crypto.randomUUID(),
  ) {}

  createDoc(ownerId: string, title: string, content: string): Doc {
    const doc: Doc = { id: `d-${++this.#seq}`, ownerId, title, content };
    this.store.docs.set(doc.id, doc);
    return doc;
  }

  createShare(userId: string, docId: string, ttl: string): Share {
    const doc = this.store.docs.get(docId);
    if (!doc || doc.ownerId !== userId) throw new NotFound("documento não encontrado");
    const ttlMs = TTL[ttl];
    if (ttlMs === undefined) throw new Invalid("validade inválida");
    const share: Share = { token: this.newToken(), docId, createdAt: this.clock(), ttlMs, revoked: false };
    this.store.shares.set(share.token, share);
    return share;
  }

  revoke(userId: string, token: string): void {
    const share = this.store.shares.get(token);
    const doc = share && this.store.docs.get(share.docId);
    if (!share || !doc || doc.ownerId !== userId) throw new NotFound("link não encontrado");
    share.revoked = true;
  }

  read(token: string): PublicDoc {
    const share = this.store.shares.get(token);
    if (!share || !isLinkValid(share, this.clock())) throw new NotFound("link não encontrado");
    const doc = this.store.docs.get(share.docId);
    if (!doc) throw new NotFound("link não encontrado");
    return { title: doc.title, content: doc.content };
  }

  listShares(userId: string): Share[] {
    return [...this.store.shares.values()].filter((s) => this.store.docs.get(s.docId)?.ownerId === userId);
  }
}

import { type Schema } from "@/amplify/data/resource";
import { Observable, Subscriber } from "rxjs";
import { client } from "./clients/supportDataClient";
import { getCurrentUser } from "aws-amplify/auth";

function maxOfDates(dates: Date[]): Date | undefined {
  if (dates.length === 0) return undefined;
  return dates.reduce((a, b) => (a > b ? a : b));
}

async function threadLastViewedAt(
  thread: Schema["Thread"]
): Promise<Date | undefined> {
  const lastViewedDates = await client.models.LastViewed.list({
    filter: { lastViewedThreadId: { eq: thread.id } },
  });
  const viewingDates = lastViewedDates.data.map(
    (seen) => new Date(seen.updatedAt)
  );

  return maxOfDates(viewingDates);
}

async function updateLastSeen(threadId: string) {
  const lastViewedDates = await client.models.LastViewed.list({
    filter: { lastViewedThreadId: { eq: threadId } },
  });
  if (lastViewedDates.data !== undefined && lastViewedDates.data.length === 0) {
    client.models.LastViewed.create({ lastViewedThreadId: threadId });
  } else {
    const [first, ...rest] = lastViewedDates.data;
    if (first) {
      client.models.LastViewed.update({ id: first.id });
    }
    rest?.forEach((e) => client.models.LastViewed.delete({ id: first.id }));
  }
}

export type MessageUpdate = "message" | "count";

export class SupportThreadManager {
  threadChangesSubscribers: Subscriber<void>[] = [];
  currentThreads: Map<string, Schema["Thread"]> = new Map();
  currentThreadMessages: Map<string, Map<string, Schema["Message"]>> =
    new Map();
  pendingMessageCount: Map<string, number> = new Map();
  pendingMessageCountChangeSubscribers: Map<
    string,
    Subscriber<MessageUpdate>[]
  > = new Map();

  constructor() {
    client.models.Thread.list({ filter: { archived: { eq: false } } }).then(
      (threadDatas) => {
        if (Array.isArray(threadDatas.data)) {
          threadDatas.data.forEach((thread) => {
            this.currentThreads.set(thread.id, thread);
            this.currentThreadMessages.set(thread.id, new Map());
            this.pendingMessageCount.set(thread.id, 0);
            this.pendingMessageCountChangeSubscribers.set(thread.id, []);
            this.refreshThread(thread);
          });
        }
        this.updatedThreads();
      }
    );

    client.models.Thread.onCreate().subscribe((thread) => {
      this.currentThreads.set(thread.id, thread);
      this.currentThreadMessages.set(thread.id, new Map());
      this.pendingMessageCount.set(thread.id, 0);
      this.pendingMessageCountChangeSubscribers.set(thread.id, []);
      this.updatedThreads();
    });

    client.models.Thread.onUpdate().subscribe((thread) => {
      if (thread.archived) {
        this.currentThreadMessages.delete(thread.id);
        this.currentThreadMessages.delete(thread.id);
        this.pendingMessageCount.delete(thread.id);
        this.pendingMessageCountChangeSubscribers.delete(thread.id);
      } else {
        this.currentThreads.set(thread.id, thread);
        this.currentThreadMessages.set(
          thread.id,
          this.currentThreadMessages.get(thread.id) ?? new Map()
        );
        this.pendingMessageCount.set(
          thread.id,
          this.pendingMessageCount.get(thread.id) ?? 0
        );
        this.pendingMessageCountChangeSubscribers.set(
          thread.id,
          this.pendingMessageCountChangeSubscribers.get(thread.id) ?? []
        );
        this.updatedThreads();
      }
    });

    client.models.Message.onCreate().subscribe((message) => {
      if (message.threadMessagesId) {
        this.currentThreadMessages
          .get(message.threadMessagesId)
          ?.set(message.id, message);
        this.pendingMessageCount.set(
          message.threadMessagesId,
          (this.pendingMessageCount.get(message.threadMessagesId) || 0) + 1
        );
        this.updatedThreadMessages(message.threadMessagesId, "message");
      }
    });

    client.models.Thread.onUpdate().subscribe((thread) => {
      if (thread.archived) {
        this.currentThreads.delete(thread.id);
        this.currentThreadMessages.delete(thread.id);
        this.updatedThreads();
      }
    });
  }

  get getCurrentThreads(): Schema["Thread"][] {
    const arr = Array.from(this.currentThreads.values());
    arr.sort((a, b) =>
      new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1
    );
    return arr;
  }

  getCurrentMessagesFor(thread: Schema["Thread"]): Schema["Message"][] {
    const arr = Array.from(
      this.currentThreadMessages.get(thread.id)?.values() ?? []
    );
    arr.sort((a, b) =>
      new Date(a.updatedAt) < new Date(b.updatedAt) ? -1 : 1
    );
    this.pendingMessageCount.set(thread.id, 0);
    this.updatedThreadMessages(thread.id, "count");
    updateLastSeen(thread.id);
    return arr;
  }

  getCurrentMessagesCountFor(thread: Schema["Thread"]): number {
    return this.pendingMessageCount.get(thread.id) ?? 0;
  }

  threadChanges(): Observable<void> {
    const observable = new Observable<void>((subscriber) => {
      this.threadChangesSubscribers.push(subscriber);
    });
    return observable;
  }

  async refreshThread(thread: Schema["Thread"]) {
    this.currentThreadMessages.set(thread.id, new Map());
    const messagesData = await thread.messages();
    const lastSeenDate = await threadLastViewedAt(thread);

    messagesData.data.forEach((message) => {
      this.currentThreadMessages
        .get(thread.id)
        // @ts-ignore
        ?.set(message.id, message);
      if (
        lastSeenDate === undefined ||
        new Date(message.createdAt) > lastSeenDate
      ) {
        this.pendingMessageCount.set(
          thread.id,
          (this.pendingMessageCount.get(thread.id) || 0) + 1
        );
        this.updatedThreadMessages(thread.id, "message");
      }
    });
    this.updatedThreadMessages(thread.id, "message");
  }

  messageChangesFor(thread: Schema["Thread"]): Observable<MessageUpdate> {
    const observable = new Observable<MessageUpdate>((subscriber) => {
      this.pendingMessageCountChangeSubscribers
        .get(thread.id)
        ?.push(subscriber);
    });
    return observable;
  }

  private updatedThreads() {
    this.threadChangesSubscribers.forEach((sub) => sub.next());
  }

  private updatedThreadMessages(id: string, message: MessageUpdate) {
    this.pendingMessageCountChangeSubscribers
      .get(id)
      ?.forEach((sub) => sub.next(message));
  }
}

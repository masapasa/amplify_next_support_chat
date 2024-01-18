import { type Schema } from "@/amplify/data/resource";
import { Observable, Subscriber } from "rxjs";
import { client } from "./clients/supportDataClient";
import { getCurrentUser } from "aws-amplify/auth";

function maxOfDates(dates: Date[]): Date | undefined {
  if (dates.length === 0) return undefined;
  return dates.reduce((a, b) => (a > b ? a : b));
}

async function lasteMessageObservedDateFor(
  thread: Schema["Thread"]
): Promise<Date | undefined> {
  // const { userId } = await getCurrentUser();
  // const observedMessages = await client.models.MessageObserved.list({
  //   filter: {
  //     and: [
  //       { messageObservedThreadId: { eq: thread.id } },
  //       { owner: { eq: userId } },
  //     ],
  //   },
  //   selectionSet: ["createdAt"],
  // });
  // const observedDates = observedMessages.data.map(
  //   (seen) => new Date(seen.createdAt)
  // );
  // return maxOfDates(observedDates);
  return undefined;
}

export class SupportThreadManager {
  threadChangesSubscribers: Subscriber<void>[] = [];
  currentThreads: Map<string, Schema["Thread"]> = new Map();
  currentThreadMessages: Map<string, Map<string, Schema["Message"]>> =
    new Map();
  pendingMessageCount: Map<string, number> = new Map();
  pendingMessageCountChangeSubscribers: Map<string, Subscriber<void>[]> =
    new Map();

  constructor() {
    client.models.Thread.list({ filter: { archived: { eq: false } } }).then(
      (threadDatas) => {
        threadDatas.data.forEach((thread) => {
          this.currentThreads.set(thread.id, thread);
          this.currentThreadMessages.set(thread.id, new Map());
          this.pendingMessageCount.set(thread.id, 0);
          this.pendingMessageCountChangeSubscribers.set(thread.id, []);
          thread.messages().then(async (messagesData) => {
            const lastSeenMessageCreatedAt = await lasteMessageObservedDateFor(
              thread
            );
            messagesData.data.forEach((message) => {
              this.currentThreadMessages
                .get(thread.id)
                ?.set(message.id, message);
              if (
                lastSeenMessageCreatedAt === undefined ||
                new Date(message.createdAt) > lastSeenMessageCreatedAt
              ) {
                this.pendingMessageCount.set(
                  thread.id,
                  (this.pendingMessageCount.get(thread.id) || 0) + 1
                );
                this.updatedThreadMessages(thread.id);
              }
            });
          });
        });
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

    client.models.Message.onCreate().subscribe((message) => {
      if (message.threadMessagesId) {
        this.currentThreadMessages
          .get(message.threadMessagesId)
          ?.set(message.id, message);
        this.updatedThreadMessages(message.threadMessagesId);
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
      new Date(a.updatedAt) < new Date(b.updatedAt) ? 1 : -1
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
    return arr;
  }

  threadChanges(): Observable<void> {
    const observable = new Observable<void>((subscriber) => {
      this.threadChangesSubscribers.push(subscriber);
    });
    return observable;
  }

  messageChangesFor(thread: Schema["Thread"]): Observable<void> {
    const observable = new Observable<void>((subscriber) => {
      this.pendingMessageCountChangeSubscribers
        .get(thread.id)
        ?.push(subscriber);
    });
    return observable;
  }

  private updatedThreads() {
    this.threadChangesSubscribers.forEach((sub) => sub.next());
  }

  private updatedThreadMessages(id: string) {
    this.pendingMessageCountChangeSubscribers
      .get(id)
      ?.forEach((sub) => sub.next());
  }
}

import { Response } from 'express';
import { db } from '../database/store.js';
import { ActivityEvent } from '../shared/types.js';
import { SensitiveDataFilter } from '../services/sensitiveDataFilter.js';

export class EventManager {
  private static sseClients = new Set<Response>();

  public static addSseClient(res: Response) {
    this.sseClients.add(res);
  }

  public static removeSseClient(res: Response) {
    this.sseClients.delete(res);
  }

  public static broadcastEvent(event: ActivityEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    this.sseClients.forEach((client) => {
      try {
        client.write(data);
      } catch (err) {
        this.sseClients.delete(client);
      }
    });
  }

  public static ingestEvent(rawEvent: Partial<ActivityEvent>): ActivityEvent {
    // Pipeline: RAW EVENT -> SENSITIVE DATA FILTER -> NORMALIZED EVENT -> DATABASE -> BROADCAST
    const { scrubbedEvent } = SensitiveDataFilter.processEvent(rawEvent);

    const storedEvent = db.addActivityEvent(scrubbedEvent);
    this.broadcastEvent(storedEvent);

    return storedEvent;
  }
}

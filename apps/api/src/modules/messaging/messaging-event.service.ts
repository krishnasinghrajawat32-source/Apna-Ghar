import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface AppRealtimeEvent {
  userId: string;
  type: string;
  data: any;
  timestamp: string;
}

@Injectable()
export class MessagingEventService {
  private readonly bus$ = new Subject<AppRealtimeEvent>();

  emitToUser(userId: string, type: string, data: any) {
    this.bus$.next({
      userId,
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  getUserStream(userId: string): Observable<MessageEvent> {
    return this.bus$.asObservable().pipe(
      filter((evt) => evt.userId === userId),
      map((evt) => ({
        data: {
          type: evt.type,
          data: evt.data,
          timestamp: evt.timestamp,
        },
      } as MessageEvent)),
    );
  }
}

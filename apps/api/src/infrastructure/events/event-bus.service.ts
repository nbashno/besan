import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEventName } from '../../domain/events/domain-events';

/**
 * غلاف رقيق حول EventEmitter2.
 * المنطق التجاري ينشر عبر هذا فقط — لا يعرف الآلية الأساسية.
 * الترقية لاحقًا إلى Kafka/RabbitMQ = تبديل هذا الملف فقط.
 */
@Injectable()
export class EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  publish<T>(event: DomainEventName, payload: T): void {
    // نشر غير متزامن حتى لا يُبطئ الحدث المسار الرئيسي (السرعة أولًا)
    this.emitter.emit(event, payload);
  }
}

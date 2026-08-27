import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IntrusionLog } from './entities/intrusion-log.entity';

export type IntrusionStatus = 'clear' | 'triggered';

export type IntrusionEvent = {
  status: IntrusionStatus;
  sensor_id: string;
  triggered_at: string | null;
};

@Injectable()
export class IntrusionDetectionService {
  private latest: IntrusionEvent = {
    status: 'clear',
    sensor_id: '',
    triggered_at: null,
  };

  constructor(
    @InjectRepository(IntrusionLog)
    private readonly intrusionLogRepository: Repository<IntrusionLog>,
  ) {}

  // ESP32 SAVE
  async reportEvent(data: any): Promise<IntrusionEvent> {
    if (data?.status !== 'clear' && data?.status !== 'triggered') {
      throw new BadRequestException(
        "status must be 'clear' or 'triggered'",
      );
    }

    const statusChanged = data.status !== this.latest.status;

    this.latest = {
      status: data.status,
      sensor_id: data.sensor_id ?? this.latest.sensor_id,
      triggered_at:
        data.status === 'triggered'
          ? new Date().toISOString()
          : this.latest.triggered_at,
    };

    /*
     * Log every genuine state change so there's a history of
     * when the sensor was triggered/cleared, not just the
     * current snapshot.
     */
    if (statusChanged) {
      const log = this.intrusionLogRepository.create({
        sensor_id: this.latest.sensor_id || null,
        status: this.latest.status,
        event_time: new Date(),
      });

      await this.intrusionLogRepository.save(log);
    }

    return this.latest;
  }

  getLatest(): IntrusionEvent {
    return this.latest;
  }

  async getLogs(limit = 50): Promise<IntrusionLog[]> {
    return this.intrusionLogRepository.find({
      order: { log_id: 'DESC' },
      take: limit,
    });
  }
}

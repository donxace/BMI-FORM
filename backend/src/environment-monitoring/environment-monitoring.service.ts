import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EnvironmentLog } from './entities/environment-log.entity';

export type EnvironmentStatus =
  | 'normal'
  | 'smoke_detected'
  | 'high_temperature';

export type EnvironmentReading = {
  temperature: number | null;
  smoke_level: number | null;
  status: EnvironmentStatus;
  sensor_id: string;
  updated_at: string | null;
};

// Placeholder thresholds until real sensors are calibrated.
const SMOKE_THRESHOLD = 1800; // raw analog reading (e.g. MQ-2 style sensor)
const TEMPERATURE_THRESHOLD = 50; // degrees Celsius

@Injectable()
export class EnvironmentMonitoringService {
  private latest: EnvironmentReading = {
    temperature: null,
    smoke_level: null,
    status: 'normal',
    sensor_id: '',
    updated_at: null,
  };

  constructor(
    @InjectRepository(EnvironmentLog)
    private readonly environmentLogRepository: Repository<EnvironmentLog>,
  ) {}

  // ESP32 SAVE
  async reportReading(data: any): Promise<EnvironmentReading> {
    const temperature =
      data.temperature != null
        ? Number(data.temperature)
        : this.latest.temperature;

    const smoke_level =
      data.smoke_level != null
        ? Number(data.smoke_level)
        : this.latest.smoke_level;

    let status: EnvironmentStatus = 'normal';

    if (smoke_level != null && smoke_level >= SMOKE_THRESHOLD) {
      status = 'smoke_detected';
    } else if (
      temperature != null &&
      temperature >= TEMPERATURE_THRESHOLD
    ) {
      status = 'high_temperature';
    }

    const statusChanged = status !== this.latest.status;

    this.latest = {
      temperature,
      smoke_level,
      status,
      sensor_id: data.sensor_id ?? this.latest.sensor_id,
      updated_at: new Date().toISOString(),
    };

    /*
     * Log every genuine state change — entering smoke_detected/
     * high_temperature, and returning to normal — so there's a
     * history of alerts, not just the current snapshot.
     */
    if (statusChanged) {
      const log = this.environmentLogRepository.create({
        sensor_id: this.latest.sensor_id || null,
        status: this.latest.status,
        temperature: this.latest.temperature,
        smoke_level: this.latest.smoke_level,
        event_time: new Date(),
      });

      await this.environmentLogRepository.save(log);
    }

    return this.latest;
  }

  getLatest(): EnvironmentReading {
    return this.latest;
  }

  async getLogs(limit = 50): Promise<EnvironmentLog[]> {
    return this.environmentLogRepository.find({
      order: { log_id: 'DESC' },
      take: limit,
    });
  }
}

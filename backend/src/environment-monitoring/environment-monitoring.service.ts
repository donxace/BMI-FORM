import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EnvironmentLog } from './entities/environment-log.entity';
import { sendAlertEmail } from '../common/alert-email';

export type EnvironmentStatus =
  | 'normal'
  | 'smoke_detected'
  | 'high_temperature';

export type EnvironmentReading = {
  temperature: number | null;
  humidity: number | null;
  smoke_level: number | null;
  status: EnvironmentStatus;
  sensor_id: string;
  updated_at: string | null;
};

// Same values as arduino/SAFETY_MONITOR (MQ-2 + SHT31), so the website
// alerts exactly when the board's buzzer goes off.
const SMOKE_THRESHOLD = 1200; // raw analog reading (MQ-2)
const TEMPERATURE_THRESHOLD = 40; // degrees Celsius

@Injectable()
export class EnvironmentMonitoringService {
  private latest: EnvironmentReading = {
    temperature: null,
    humidity: null,
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

    const humidity =
      data.humidity != null
        ? Number(data.humidity)
        : this.latest.humidity;

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
      humidity,
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
        humidity: this.latest.humidity,
        smoke_level: this.latest.smoke_level,
        event_time: new Date(),
      });

      await this.environmentLogRepository.save(log);

      if (status !== 'normal') {
        sendAlertEmail(
          status,
          status === 'smoke_detected'
            ? `Smoke detected (${this.latest.sensor_id || 'sensor'})`
            : `High temperature (${this.latest.sensor_id || 'sensor'})`,
          {
            Sensor: this.latest.sensor_id || null,
            'Smoke level': `${smoke_level ?? '—'} (alert at ${SMOKE_THRESHOLD})`,
            Temperature: `${temperature ?? '—'} °C (alert at ${TEMPERATURE_THRESHOLD} °C)`,
            Humidity: humidity != null ? `${humidity} %` : null,
          },
        );
      }
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

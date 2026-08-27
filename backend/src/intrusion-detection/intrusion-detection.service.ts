import { BadRequestException, Injectable } from '@nestjs/common';

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

  // ESP32 SAVE
  reportEvent(data: any): IntrusionEvent {
    if (data?.status !== 'clear' && data?.status !== 'triggered') {
      throw new BadRequestException(
        "status must be 'clear' or 'triggered'",
      );
    }

    this.latest = {
      status: data.status,
      sensor_id: data.sensor_id ?? this.latest.sensor_id,
      triggered_at:
        data.status === 'triggered'
          ? new Date().toISOString()
          : this.latest.triggered_at,
    };

    return this.latest;
  }

  getLatest(): IntrusionEvent {
    return this.latest;
  }
}

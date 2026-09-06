import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HealthReportsModule } from './health-reports/health-reports.module';
import { PersonnelModule } from './personnel/personnel.module';
import { BmiAssessmentsModule } from './bmi-assessments/bmi-assessments.module';
import { AuthModule } from './auth/auth.module'; 
import { RanksModule } from './ranks/ranks.module';
import { Rank } from './ranks/rank.entity';
import { IntrusionDetectionModule } from './intrusion-detection/intrusion-detection.module';
import { EnvironmentMonitoringModule } from './environment-monitoring/environment-monitoring.module';
import { InventoryModule } from './inventory/inventory.module';
import { PcInfoModule } from './pc-info/pc-info.module';

@Module({
  imports: [
    // App-wide default: 600 requests / minute per IP (10/s) — generous
    // enough to cover the app's several 1-second polling loops (Kiosk's
    // RFID/reading checks, Environment Monitoring's sensor checks) from
    // one machine with headroom, while still being a real ceiling against
    // abuse. The login routes (see auth.controller.ts) override this with
    // a much stricter limit via @Throttle() — that's the one that
    // actually matters for brute-force protection.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 600,
      },
    ]),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'bmi_monitoring',
      entities: [Rank /* , Personnel */], // Add Rank here
      synchronize: false,
      autoLoadEntities: true,

    }),

    // Second, separate connection: the Hardware Inventory domain's own
    // database (itms_inventech), kept independent from bmi_monitoring
    // above so neither domain's schema/entities can collide.
    TypeOrmModule.forRoot({
      name: 'inventory',
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'itms_inventech',
      synchronize: false,
      autoLoadEntities: true,
    }),

    HealthReportsModule,

    PersonnelModule,

    BmiAssessmentsModule,

    AuthModule,

    RanksModule,

    IntrusionDetectionModule,

    EnvironmentMonitoringModule,

    InventoryModule,

    PcInfoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
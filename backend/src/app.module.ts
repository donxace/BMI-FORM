import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthReportsModule } from './health-reports/health-reports.module';
import { PersonnelModule } from './personnel/personnel.module';
import { BmiAssessmentsModule } from './bmi-assessments/bmi-assessments.module';
import { AuthModule } from './auth/auth.module'; 
import { RanksModule } from './ranks/ranks.module';
import { Rank } from './ranks/rank.entity';
import { IntrusionDetectionModule } from './intrusion-detection/intrusion-detection.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'bmi_monitoring',
      entities: [Rank /* , Personnel */], // Add Rank here
      synchronize: false, 
      autoLoadEntities: true,

    }),

    HealthReportsModule,

    PersonnelModule,

    BmiAssessmentsModule,

    AuthModule,

    RanksModule,

    IntrusionDetectionModule,
  ],
})
export class AppModule {}
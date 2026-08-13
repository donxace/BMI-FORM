import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthReportsModule } from './health-reports/health-reports.module';
import { PersonnelModule } from './personnel/personnel.module';
import { BmiAssessmentsModule } from './bmi-assessments/bmi-assessments.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'bmi_monitoring',

      autoLoadEntities: true,
      synchronize: false,
    }),

    HealthReportsModule,

    PersonnelModule,

    BmiAssessmentsModule,
  ],
})
export class AppModule {}
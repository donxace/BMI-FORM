import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

@Injectable()
export class HealthReportsService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async generateBmiPdf(
    assessmentId: number,
  ): Promise<Buffer> {

    // ==============================
    // GET DATA FROM DATABASE
    // ==============================

    const result = await this.dataSource.query(
      `
      SELECT
          p.rank,
          p.surname,
          p.first_name,
          p.middle_initial,
          p.q,
          p.age,
          p.sex,
          p.office,

          b.height,
          b.weight,
          b.waist,
          b.hip,
          b.wrist,
          b.bmi,
          b.ibw,
          b.weight_to_lose,
          b.pnp_classification,
          b.who_classification,
          b.assessment_date,
          b.unit_representative,
          b.health_service_representative,
          b.encoder

      FROM personnel p

      INNER JOIN bmi_assessments b
          ON p.personnel_id = b.personnel_id

      WHERE b.assessment_id = ?
      `,
      [assessmentId],
    );

    // ==============================
    // CHECK IF RECORD EXISTS
    // ==============================

    if (!result || result.length === 0) {
      throw new NotFoundException(
        `BMI assessment ${assessmentId} not found`,
      );
    }

    const assessment = result[0];

    // ==============================
    // PREPARE TEMPLATE DATA
    // ==============================

    const data = {
      rank: assessment.rank,
      surname: assessment.surname,
      firstName: assessment.first_name,
      middleInitial: assessment.middle_initial,
      q: assessment.q ?? '',
      signature: '',

      age: assessment.age,
      sex: assessment.sex,
      office: assessment.office,
      date: this.formatDate(assessment.assessment_date),

      height: assessment.height,
      weight: assessment.weight,
      waist: assessment.waist ?? '',
      hip: assessment.hip ?? '',
      wrist: assessment.wrist ?? '',

      bmi: assessment.bmi,
      ibw: assessment.ibw ?? '',
      weightToLose: assessment.weight_to_lose ?? '',

      pnpClassification:
        assessment.pnp_classification ?? '',

      whoClassification:
        assessment.who_classification ?? '',

      unitRepresentative:
        assessment.unit_representative ?? '',

      healthServiceRepresentative:
        assessment.health_service_representative ?? '',

      encoder: assessment.encoder ?? '',
    };

    // ==============================
    // TEMPLATE DIRECTORY
    // ==============================

    const templateDir = path.join(
      process.cwd(),
      'pdf-templates',
      'bmi',
    );

    const templatePath = path.join(
      templateDir,
      'index.html',
    );

    // ==============================
    // READ TEMPLATE
    // ==============================

    let html = fs.readFileSync(
      templatePath,
      'utf8',
    );

    // ==============================
    // REPLACE DATA
    // ==============================

    for (const [key, value] of Object.entries(data)) {

      const placeholder = new RegExp(
        `{{${key}}}`,
        'g',
      );

      html = html.replace(
        placeholder,
        String(value ?? ''),
      );
    }

    // ==============================
    // CREATE TEMPORARY HTML
    // ==============================

    const tempHtmlPath = path.join(
      templateDir,
      `generated-bmi-${assessmentId}.html`,
    );

    fs.writeFileSync(
      tempHtmlPath,
      html,
      'utf8',
    );

    // ==============================
    // START BROWSER
    // ==============================

    const browser = await puppeteer.launch({
      headless: true,
    });

    try {

      const page = await browser.newPage();

      // ==============================
      // A4 VIEWPORT
      // ==============================

      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });

      // ==============================
      // LOAD HTML FILE
      // ==============================

      await page.goto(
        `file://${tempHtmlPath}`,
        {
          waitUntil: 'load',
        },
      );

      // ==============================
      // WAIT FOR IMAGES
      // ==============================

      await page.evaluate(async () => {

        const images =
          Array.from(document.images);

        await Promise.all(
          images.map((img) => {

            if (img.complete) {
              return Promise.resolve();
            }

            return new Promise<void>((resolve) => {

              img.onload = () => resolve();

              img.onerror = () => resolve();

            });

          }),
        );

      });

      // ==============================
      // GENERATE PDF
      // ==============================

      const pdf = await page.pdf({

        format: 'A4',

        printBackground: true,

        preferCSSPageSize: true,

        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },

      });

      return Buffer.from(pdf);

    } finally {

      // ==============================
      // CLOSE BROWSER
      // ==============================

      await browser.close();

      // ==============================
      // DELETE TEMPORARY HTML
      // ==============================

      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }

    }
  }

  // ==============================
  // FORMAT DATE
  // ==============================

  private formatDate(date: Date | string): string {

    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    const month = String(
      parsedDate.getMonth() + 1,
    ).padStart(2, '0');

    const day = String(
      parsedDate.getDate(),
    ).padStart(2, '0');

    const year =
      parsedDate.getFullYear();

    return `${month}/${day}/${year}`;
  }
}
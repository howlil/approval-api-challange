
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { AppModule } from '../src/app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('API Dot-ID')
    .setDescription(
      'Dokumentasi API untuk aplikasi manajemen permintaan (request) dan persetujuan (approval). ' +
        'Semua response mengikuti format: `{ data, success, message }`. Endpoint yang memerlukan autentikasi menggunakan Bearer JWT.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token JWT dari endpoint login' },
      'JWT',
    )
    .addTag('Autentikasi', 'Login dan token JWT')
    .addTag('Pengguna', 'Registrasi dan profil pengguna')
    .addTag('Permintaan', 'CRUD permintaan (hanya CREATOR bisa buat/ubah)')
    .addTag('Persetujuan', 'Keputusan approve/reject dan riwayat (role APPROVER)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  if (!document.servers || document.servers.length === 0) {
    document.servers = [{ url: 'http://localhost:3000', description: 'Server lokal (development)' }];
  }
  const yamlStr = yaml.dump(document, { lineWidth: 120, noRefs: true });
  const outPath = 'swagger.yml';
  fs.writeFileSync(outPath, yamlStr, 'utf8');
  console.log(`Dokumentasi API telah ditulis ke: ${outPath}`);

  await app.close();
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

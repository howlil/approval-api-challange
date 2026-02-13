/**
 * E2E tests for full application flow.
 * Requires: running database and .env (DATABASE_*, JWT_SECRET).
 * Run: pnpm run test:e2e
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Application (e2e)', () => {
  let app: INestApplication;
  const ts = Date.now();
  const creatorUser = {
    email: `creator-${ts}@e2e.test`,
    password: 'password123',
    name: 'Creator User',
    role: 'CREATOR' as const,
  };
  const approverUser = {
    email: `approver-${ts}@e2e.test`,
    password: 'password123',
    name: 'Approver User',
    role: 'APPROVER' as const,
  };
  let creatorToken: string;
  let approverToken: string;
  let createdRequestId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const server = app.getHttpServer();

    await request(server).post('/api/v1/users').send(creatorUser).expect(201);
    await request(server).post('/api/v1/users').send(approverUser).expect(201);

    const creatorLogin = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: creatorUser.email, password: creatorUser.password });
    creatorToken = creatorLogin.body?.data?.access_token ?? '';

    const approverLogin = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: approverUser.email, password: approverUser.password });
    approverToken = approverLogin.body?.data?.access_token ?? '';
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  const auth = () => ({
    creator: () => ({ Authorization: `Bearer ${creatorToken}` }),
    approver: () => ({ Authorization: `Bearer ${approverToken}` }),
  });

  describe('POST /api/v1/users (register)', () => {
    it('returns 400 when body is empty', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send({})
        .expect(400);
    });

    it('returns 400 when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'invalid',
          password: 'password123',
          role: 'CREATOR',
        })
        .expect(400);
    });

    it('returns 400 when password too short', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: 'new@e2e.test',
          password: 'short',
          role: 'CREATOR',
        })
        .expect(400);
    });

    it('returns 409 when email already registered', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send(creatorUser)
        .expect(409);
    });

    it('returns 201 and user without password when valid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          email: `newuser-${ts}@e2e.test`,
          password: 'password123',
          name: 'New',
          role: 'CREATOR',
        })
        .expect(201);
      expect(res.body.data?.password).toBeUndefined();
      expect(res.body.data?.email).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 400 when body is empty', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });

    it('returns 401 when credentials are wrong', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: creatorUser.email, password: 'wrong' })
        .expect(401);
    });

    it('returns 200 and access_token when valid', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: creatorUser.email, password: creatorUser.password })
        .expect(200)
        .expect((res) => {
          expect(res.body.data?.access_token).toBeDefined();
        });
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('returns 401 when no token', () => {
      return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('returns 200 and user when token valid', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set(auth().creator())
        .expect(200)
        .expect((res) => {
          expect(res.body.data?.email).toBe(creatorUser.email);
          expect(res.body.data?.role).toBe('CREATOR');
        });
    });
  });

  describe('Requests (CRUD)', () => {
    it('POST /api/v1/requests returns 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/requests')
        .send({ title: 'Test', description: 'Desc' })
        .expect(401);
    });

    it('POST /api/v1/requests returns 403 when APPROVER', () => {
      return request(app.getHttpServer())
        .post('/api/v1/requests')
        .set(auth().approver())
        .send({ title: 'Test', description: 'Desc' })
        .expect(403);
    });

    it('POST /api/v1/requests returns 400 when title empty', () => {
      return request(app.getHttpServer())
        .post('/api/v1/requests')
        .set(auth().creator())
        .send({ title: '', description: 'Desc' })
        .expect(400);
    });

    it('POST /api/v1/requests returns 201 when CREATOR', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/requests')
        .set(auth().creator())
        .send({ title: 'E2E Request', description: 'From test' })
        .expect(201);
      expect(res.body.data?.id).toBeDefined();
      expect(res.body.data?.title).toBe('E2E Request');
      expect(res.body.data?.status).toBe('PENDING');
      createdRequestId = res.body.data.id;
    });

    it('GET /api/v1/requests returns 401 without token', () => {
      return request(app.getHttpServer()).get('/api/v1/requests').expect(401);
    });

    it('GET /api/v1/requests returns 200 with items for CREATOR', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/requests')
        .set(auth().creator())
        .expect(200);
      expect(Array.isArray(res.body.data?.items)).toBe(true);
      expect(res.body.data?.total).toBeDefined();
      expect(res.body.data?.items?.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/requests returns 200 for APPROVER', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/requests')
        .set(auth().approver())
        .expect(200);
      expect(Array.isArray(res.body.data?.items)).toBe(true);
    });

    it('GET /api/v1/requests/:id returns 404 for invalid id', () => {
      return request(app.getHttpServer())
        .get('/api/v1/requests/00000000-0000-0000-0000-000000000000')
        .set(auth().creator())
        .expect(404);
    });

    it('GET /api/v1/requests/:id returns 200 for owner', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/requests/${createdRequestId}`)
        .set(auth().creator())
        .expect(200)
        .expect((res) => {
          expect(res.body.data?.id).toBe(createdRequestId);
          expect(res.body.data?.creator).toBeDefined();
        });
    });

    it('GET /api/v1/requests/:id returns 200 for APPROVER', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/requests/${createdRequestId}`)
        .set(auth().approver())
        .expect(200);
    });

    it('PATCH /api/v1/requests/:id returns 403 when APPROVER', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/requests/${createdRequestId}`)
        .set(auth().approver())
        .send({ title: 'Updated' })
        .expect(403);
    });

    it('PATCH /api/v1/requests/:id returns 200 when CREATOR owner', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/requests/${createdRequestId}`)
        .set(auth().creator())
        .send({ title: 'E2E Updated', description: 'Updated desc' })
        .expect(200);
      expect(res.body.data?.title).toBe('E2E Updated');
    });
  });

  describe('Approvals', () => {
    it('POST /api/v1/requests/:id/decide returns 401 without token', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/requests/${createdRequestId}/decide`)
        .send({ decision: 'APPROVED', note: 'OK' })
        .expect(401);
    });

    it('POST /api/v1/requests/:id/decide returns 403 when CREATOR', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/requests/${createdRequestId}/decide`)
        .set(auth().creator())
        .send({ decision: 'APPROVED', note: 'OK' })
        .expect(403);
    });

    it('POST /api/v1/requests/:id/decide returns 400 when body invalid', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/requests/${createdRequestId}/decide`)
        .set(auth().approver())
        .send({ decision: 'INVALID' })
        .expect(400);
    });

    it('POST /api/v1/requests/:id/decide returns 201 when APPROVER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/requests/${createdRequestId}/decide`)
        .set(auth().approver())
        .send({ decision: 'APPROVED', note: 'E2E approved' })
        .expect(201);
      expect(res.body.data?.decision).toBe('APPROVED');
      expect(res.body.data?.status).toBe('APPROVED');
    });

    it('POST /api/v1/requests/:id/decide returns 400 when already decided', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/requests/${createdRequestId}/decide`)
        .set(auth().approver())
        .send({ decision: 'REJECTED', note: 'Second' })
        .expect(400);
    });

    it('GET /api/v1/requests/:id/approvals returns 401 without token', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/requests/${createdRequestId}/approvals`)
        .expect(401);
    });

    it('GET /api/v1/requests/:id/approvals returns 200 with history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/requests/${createdRequestId}/approvals`)
        .set(auth().creator())
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data?.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data?.[0]?.decision).toBe('APPROVED');
    });
  });

  describe('Request after approval (business rules)', () => {
    it('PATCH /api/v1/requests/:id returns 400 when status not PENDING', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/requests/${createdRequestId}`)
        .set(auth().creator())
        .send({ title: 'Try update after approve' })
        .expect(400);
    });
  });
});

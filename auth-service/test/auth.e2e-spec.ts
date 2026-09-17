import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    name: 'Linda Teste',
    email: 'linda.e2e@teste.com',
    password: 'senha123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // limpa o usuário de teste pra não acumular lixo nem quebrar o teste na próxima execução
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('deve registrar um novo usuário e retornar um accessToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('deve rejeitar registro com e-mail já existente (409)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('deve rejeitar registro com e-mail inválido (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'nao-e-um-email' })
        .expect(400);
    });

    it('deve rejeitar registro com senha curta demais (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'outro@teste.com', password: '123' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('deve logar com credenciais corretas e retornar accessToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('deve rejeitar login com senha errada (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'senhaErrada' })
        .expect(401);
    });

    it('deve rejeitar login com e-mail inexistente (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'naoexiste@teste.com', password: 'qualquer' })
        .expect(401);
    });
  });
});
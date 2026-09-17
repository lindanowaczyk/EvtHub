import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const testUser = {
    name: 'Users Teste',
    email: 'users.e2e@teste.com',
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

    // cria um usuário real via endpoint pra pegar um token válido de verdade
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    accessToken = response.body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('GET /users/me', () => {
    it('deve retornar os dados do usuário autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        name: testUser.name,
        email: testUser.email,
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('deve rejeitar sem token (401)', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('deve rejeitar com token inválido (401)', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer token-invalido-qualquer')
        .expect(401);
    });

    it('deve rejeitar com header Authorization malformado (401)', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', accessToken) 
        .expect(401);
    });
  });
});
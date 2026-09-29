import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  const mockContext = (userRole: string) =>
    ({
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole } }),
      }),
    }) as unknown as ExecutionContext;

  it('permite acesso quando a rota não exige role específica', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('PARTICIPANT'))).toBe(true);
  });

  it('permite acesso quando o role do usuário bate com o exigido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORGANIZER']);
    expect(guard.canActivate(mockContext('ORGANIZER'))).toBe(true);
  });

  it('bloqueia acesso quando o role não bate', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORGANIZER']);
    expect(() => guard.canActivate(mockContext('PARTICIPANT'))).toThrow(ForbiddenException);
  });
});
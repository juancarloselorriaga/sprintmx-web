import type { Session } from '@/lib/auth/types';
import type { ProfileStatus } from '@/lib/profiles';

const mockGetSession = jest.fn();
const mockResolveUserContext = jest.fn();

jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => new Headers()),
}));

jest.mock('@/lib/auth/user-context', () => ({
  EMPTY_PROFILE_STATUS: {
    hasProfile: false,
    isComplete: false,
    mustCompleteProfile: false,
  },
  resolveUserContext: mockResolveUserContext,
}));

describe('getAuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses projected profile status from the session when available', async () => {
    const projectedStatus: ProfileStatus = {
      hasProfile: true,
      isComplete: true,
      mustCompleteProfile: false,
    };
    const session = {
      session: {
        id: 'sess-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        expiresAt: new Date(),
        token: 'token',
        ipAddress: '1.1.1.1',
        userAgent: 'jest',
      },
      roles: ['admin'],
      isInternal: true,
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'user@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        image: null,
        isInternal: true,
        profileStatus: projectedStatus,
      },
    } as unknown as Session;

    mockGetSession.mockResolvedValue(session);
    mockResolveUserContext.mockResolvedValue({
      roles: session.roles ?? [],
      isInternal: session.isInternal ?? false,
      profileStatus: projectedStatus,
    });

    let context;
    await jest.isolateModulesAsync(async () => {
      const { getAuthContext } = await import('@/lib/auth/server');
      context = await getAuthContext();
    });

    expect(context!.profileStatus).toEqual(projectedStatus);
    expect(context!.isInternal).toBe(true);
    expect(context!.roles).toEqual(session.roles);
    // Projection should be used; even if resolveUserContext runs, status should match projected.
  });

  it('falls back to resolveUserContext when projection is missing', async () => {
    const computedStatus: ProfileStatus = {
      hasProfile: true,
      isComplete: false,
      mustCompleteProfile: true,
    };
    mockGetSession.mockResolvedValue({
      session: {
        id: 'sess-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-2',
        expiresAt: new Date(),
        token: 'token',
        ipAddress: '1.1.1.1',
        userAgent: 'jest',
      },
      user: {
        id: 'user-2',
        name: 'Missing Projection',
        email: 'missing@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        image: null,
      },
    } as unknown as Session);

    mockResolveUserContext.mockResolvedValue({
      roles: [],
      isInternal: false,
      profileStatus: computedStatus,
    });

    let context;
    await jest.isolateModulesAsync(async () => {
      const { getAuthContext } = await import('@/lib/auth/server');
      context = await getAuthContext();
    });

    expect(context!.profileStatus).toEqual(computedStatus);
    expect(context!.isInternal).toBe(false);
    expect(mockResolveUserContext).toHaveBeenCalledTimes(1);
  });
});

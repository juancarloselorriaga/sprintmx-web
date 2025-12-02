jest.mock('@/lib/auth/server', () => ({
  getAuthContext: jest.fn(),
}));

import { requireProfileCompleteUser, UnauthenticatedError, } from '@/lib/auth/guards';
import type { AuthContext } from '@/lib/auth/server';
import { getAuthContext } from '@/lib/auth/server';
import type { Session } from '@/lib/auth/types';
import type { ProfileStatus } from '@/lib/profiles';

const mockGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>;

describe('requireProfileCompleteUser', () => {
  beforeEach(() => {
    mockGetAuthContext.mockReset();
  });

  it('throws when unauthenticated', async () => {
    mockGetAuthContext.mockResolvedValue({
      session: null,
      user: null,
      roles: [],
      isInternal: false,
      profileStatus: {
        hasProfile: false,
        isComplete: false,
        mustCompleteProfile: true
      },
    });

    await expect(requireProfileCompleteUser()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('throws ProfileIncompleteError when enforcement is required', async () => {
    const status: ProfileStatus = {
      hasProfile: true,
      isComplete: false,
      mustCompleteProfile: true,
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
      roles: [],
      isInternal: false,
      user: {
        id: 'user-1',
        email: 'u@example.com',
        name: 'User One',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isInternal: false,
        profileStatus: status,
      },
    } as unknown as Session;

    mockGetAuthContext.mockResolvedValue({
      session,
      user: session.user,
      roles: session.roles ?? [],
      isInternal: session.isInternal ?? false,
      profileStatus: status,
    });

    await expect(requireProfileCompleteUser()).rejects.toMatchObject({
      code: 'PROFILE_INCOMPLETE',
      profileStatus: status,
    });
  });

  it('returns context when internal', async () => {
    const session = {
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
      roles: ['admin'],
      isInternal: true,
      user: {
        id: 'user-2',
        email: 'i@example.com',
        name: 'Internal User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isInternal: true,
        profileStatus: {
          hasProfile: false,
          isComplete: false,
          mustCompleteProfile: true,
        },
      },
    } as unknown as Session;

    const context: AuthContext = {
      session,
      user: session.user,
      roles: session.roles ?? [],
      isInternal: session.isInternal ?? false,
      profileStatus: session.user.profileStatus,
    };

    mockGetAuthContext.mockResolvedValue(context);

    await expect(requireProfileCompleteUser()).resolves.toEqual(context);
  });

  it('returns context when profile is complete', async () => {
    const session = {
      session: {
        id: 'sess-3',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-3',
        expiresAt: new Date(),
        token: 'token',
        ipAddress: '1.1.1.1',
        userAgent: 'jest',
      },
      roles: [],
      isInternal: false,
      user: {
        id: 'user-3',
        email: 'c@example.com',
        name: 'Complete User',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isInternal: false,
        profileStatus: {
          hasProfile: true,
          isComplete: true,
          mustCompleteProfile: false,
        },
      },
    } as unknown as Session;

    const context: AuthContext = {
      session,
      user: session.user,
      roles: session.roles ?? [],
      isInternal: session.isInternal ?? false,
      profileStatus: session.user.profileStatus,
    };

    mockGetAuthContext.mockResolvedValue(context);

    await expect(requireProfileCompleteUser()).resolves.toEqual(context);
  });
});

import UserAvatar from '@/app/components/auth/user-avatar';
import { Button } from '@/app/components/ui/button';
import { signOutAction } from '@/lib/api/auth.server';
import { User } from '@supabase/auth-js';
import { LucideLogOut } from 'lucide-react';
import { FC } from 'react';

interface AuthenticationControlsCompactProps {
  initialUser: User | null;
  cb?: () => void;
}

const AuthControlsCompact: FC<AuthenticationControlsCompactProps> = ({
  cb,
  initialUser,
}) => {
  return (
    <div className="flex gap-3 items-center">
      <UserAvatar size="sm" onClick={cb} user={initialUser}/>
      <Button
        onClick={() => {
          void signOutAction();
          cb?.();
        }}
        variant="ghost"
        size="icon"
      >
        <LucideLogOut size={16}/>
      </Button>
    </div>
  );
};

export default AuthControlsCompact;

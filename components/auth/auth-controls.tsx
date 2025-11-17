import { AuthControls as AuthControlsClient } from '@/components/auth/auth-controls.client';

async function AuthControls() {
  return <AuthControlsClient user={null}/>;
}

export { AuthControls };

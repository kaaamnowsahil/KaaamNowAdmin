import { apiRequest, ApiError } from '@/api/client';

type AdminLoginResponse = {
  tokens?: {
    access_token?: string;
  };
};

export async function loginAdmin(email: string, password: string) {
  const response = await apiRequest<AdminLoginResponse>('/api/v1/auth/admin/login', null, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const accessToken = response.tokens?.access_token;
  if (!accessToken) {
    throw new ApiError('The sign-in response did not include an access token.');
  }
  return accessToken;
}

export interface AuthResponse {
  access_token?: string;
  ref_token?:string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}
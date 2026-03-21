import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly _supabase: SupabaseClient;
  private readonly _supabaseAdmin: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this._supabase = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_ANON_KEY'),
    );
    this._supabaseAdmin = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /** Anon client — use only for auth operations (signUp, signIn, etc.) */
  get supabase(): SupabaseClient {
    return this._supabase;
  }

  /** Service role client — use for DB queries, bypasses RLS */
  get supabaseAdmin(): SupabaseClient {
    return this._supabaseAdmin;
  }

  /** Creates a short-lived client scoped to a user's JWT — use for Storage calls */
  clientForUser(jwt: string): SupabaseClient {
    return createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );
  }
}

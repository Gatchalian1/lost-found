/* =====================================================
   GRC Lost and Found - Supabase connection
   These two values connect every page to the shared database.
   The URL and the "publishable" key are meant to be public
   (the browser already receives them), so it is fine to keep
   them in this file.
   ===================================================== */

var SUPABASE_URL = 'https://mehxlmawuafluidwsfwt.supabase.co';
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Jyvk9Kj_PgCZtciMMXmfBg_8sxMp_xx';

/* the shared database client that script.js uses everywhere */
var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

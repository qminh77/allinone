-- Migration 019: Sync module catalog entries added after the full seed.
-- Runtime sync keeps the complete catalog current; this migration covers
-- deployments before the server-side sync has run.

insert into public.modules (
  key,
  name,
  description,
  icon,
  is_enabled,
  sort_order,
  href,
  category,
  is_new,
  is_popular
) values
  (
    'ai-assistant',
    'AI Assistant',
    'Tìm chức năng và hỗ trợ tạo nội dung cho mail, quiz, flashcard bằng model AI cấu hình động.',
    'ai-assistant',
    true,
    1,
    '/dashboard/ai',
    'AI',
    true,
    true
  ),
  (
    'qr-code',
    'QR Code Generator',
    'Tạo QR URL, WiFi, vCard, SMS, email, sự kiện, social, file và app với preview realtime.',
    'qr-code',
    true,
    16,
    '/tools/qr-code',
    'Utilities',
    true,
    true
  ),
  (
    'text-formatter',
    'Text Formatter',
    'Định dạng văn bản: uppercase, lowercase, capitalize và đảo ngược nội dung.',
    'text-formatter',
    true,
    23,
    '/tools/text-formatter',
    'Utilities',
    true,
    false
  ),
  (
    'flashcard-system',
    'Flashcards',
    'Tạo, quản lý và chia sẻ các bộ flashcard học tập.',
    'flashcard-system',
    true,
    45,
    '/dashboard/flashcards/library',
    'Utilities',
    true,
    true
  )
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  href = excluded.href,
  category = excluded.category,
  is_new = excluded.is_new,
  is_popular = excluded.is_popular,
  updated_at = now();

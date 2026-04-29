-- Move Flow out of the AI category for existing module catalog rows.

update public.modules
set
  category = 'Automation',
  description = 'Visual workflow builder để tự động hóa API, bot, dữ liệu và tác vụ bằng canvas kéo-thả.'
where key = 'flow-builder';

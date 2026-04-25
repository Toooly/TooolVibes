alter table public.tools
drop constraint if exists tools_category_allowed_check;

alter table public.tools
add constraint tools_category_allowed_check
check (
  category = any (
    array[
      'Assistente AI',
      'Design',
      'Developer',
      'Marketing',
      'Produttivita',
      'Video',
      'Writing'
    ]
  )
);

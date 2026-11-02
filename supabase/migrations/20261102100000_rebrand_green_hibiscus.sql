-- Rebrand "Green Hibiscus (Bag)" as "Rose Hibiscus Ruby" to match the new
-- tin packaging artwork. Slug stays the same so existing cart items, orders
-- and URLs keep working.

update public.products
set name = 'Rose Hibiscus Ruby',
    description = 'Sunflower microgreens with rose, hibiscus, and lemon peel. Floral, tart, and naturally uplifting — a little green, a better ritual.'
where slug = 'green-hibiscus-bag';

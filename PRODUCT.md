# Hôm nay ăn gì?

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React and Vite, Supabase PostgreSQL/Auth, Vercel. The user requested this migration on 07/11/2026.

## Users and Purpose

Vietnamese-speaking diners choose a dish, find a restaurant or follow a recipe. Restaurant owners sign up and submit their own restaurant and menu. Administrators maintain the catalog and review submissions.

## Capabilities and Constraints

Preserve the existing public pages, filters, favorites, recipes and admin editing. The user confirmed that the committed catalog is the migration source; do not connect to or overwrite the existing MySQL database. Keep external GrabFood/ShopeeFood links; no delivery partner credentials have been supplied.

Implementation assumption: owner changes require admin approval before publication. Ownership and admin access must be enforced in PostgreSQL, independently of the browser. Contact email and review notes are private.

## Brand Commitments

Keep the existing Vietnamese name, content, typography, light/dark themes, food imagery and responsive design. This is a technical migration and extension, not a visual rebrand.

## Evidence on Hand

105 dishes, 105 imported directory entries, 109 associations and 14 reference recipes in `data/`. Imported entries are not verified partner menus. New partner data must identify its source and consent to publication.

## Open Decisions

Supabase and Vercel account connections, production domain, and course stack constraints have not been confirmed. Supabase email delivery and redirect URLs require deployment configuration.

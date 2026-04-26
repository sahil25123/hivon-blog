# Hivon Blog - Full Stack Internship Assignment

A role-based blogging platform built with Next.js and Supabase, with AI-generated summaries for newly created posts.

## Objective

Build a basic full-stack blogging platform that demonstrates:

- Authentication and role-based access
- CRUD-style blog flows (with edit permissions)
- AI integration for post summaries
- Clean deployment and documentation

## Mandatory AI Tool Usage

Tool used:

- GitHub Copilot (GPT-5.3-Codex)

Why this tool was selected:

- Fast iteration while building multiple routes and components
- Helpful for Supabase query scaffolding and App Router structure
- Useful for debugging and refactoring repeated patterns

How it helped in development:

- Generated starter implementations for auth, role guards, and dashboard pages
- Assisted in wiring Supabase auth/database/storage operations
- Helped validate edge cases and improve error/loading states

## Tech Stack

- Frontend + Backend: Next.js (App Router, JavaScript)
- Authentication: Supabase Auth
- Database: Supabase Postgres
- Storage: Supabase Storage
- Styling: Tailwind CSS
- AI Integration: Google Gemini API (`gemini-1.5-flash`)
- Version Control: Git + GitHub
- Deployment: Vercel

## Implemented Features

### User Roles and Permissions

- Author: create posts, edit own posts, view comments
- Viewer: view posts, read summaries, comment
- Admin: view all posts, edit any post, monitor comments

### Blog Features

- Post fields: title, featured image, body content, comments section
- Search by post title
- Pagination on post listing
- Edit functionality with role-based restrictions

### AI Feature

When a new post is created:

1. Post image is uploaded to Supabase Storage (`post-images` bucket)
2. Post body is sent to Gemini to generate a concise ~200-word summary
3. Summary is stored in the posts table
4. Summary is displayed on listing and details pages

## Database Design

### Tables

- `users`: `id`, `name`, `email`, `role`
- `posts`: `id`, `title`, `body`, `image_url`, `author_id`, `summary`
- `comments`: `id`, `post_id`, `user_id`, `comment_text`

### Default Role for New Signups

```sql
alter table public.users
alter column role set default 'viewer';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.users (id, name, email, role)
	values (
		new.id,
		coalesce(new.raw_user_meta_data->>'name', ''),
		new.email,
		'viewer'
	)
	on conflict (id) do nothing;
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

### Promote User to Author or Admin

```sql
update public.users
set role = 'author'
where email = 'author@example.com';

update public.users
set role = 'admin'
where email = 'admin@example.com';
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

3. Run development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Important Routes

- `/login`
- `/signup`
- `/dashboard`
- `/dashboard/posts/create`
- `/dashboard/posts/[id]`
- `/dashboard/posts/[id]/edit`

## Deployment Steps

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy and confirm public access

## Feature Logic Explanation

### Authentication Flow

- Signup/login handled through Supabase Auth
- Session checked in client components and middleware
- Protected dashboard routes redirect unauthenticated users to login

### Role-Based Access

- `RoleGuard` checks current user role from `public.users`
- Create Post restricted to `author` and `admin`
- Edit Post allowed for admin or the post owner when role is author

### Post Creation Logic

1. Validate user session and form data
2. Upload featured image to Supabase Storage
3. Generate summary from body using Gemini
4. Insert post record with summary and author id

### AI Summary Generation Flow

- Prompt requests a concise 200-word summary
- Summary generated only once during post creation
- Summary saved in database and reused on reads

## Cost Optimization

- AI summary is generated only on initial creation
- Summary is persisted in database to avoid repeated API calls
- Existing summaries are reused in listing and details pages
- No regeneration during post edits

## Development Understanding

Bug encountered and resolution:

- Issue: React hook warning in comment loading flow due unstable effect dependency
- Fix: wrapped comment loader with `useCallback` and aligned effect dependencies

Key architecture decisions:

- Server components for data-fetch pages
- Client components only for interactive UI
- Supabase SSR clients split for browser and server contexts
- Middleware-based route protection for dashboard paths

## Submission Checklist

1. GitHub repository link: Add your link here
2. Live deployed URL: Add your link here
3. Written explanation included in this README for:
	 - AI tools used and why
	 - Feature logic
	 - Cost optimization
	 - Development understanding

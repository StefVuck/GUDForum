-- Initialize PostgreSQL database for GU Drones Forum

-- Set configuration
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Set default settings
SET default_tablespace = '';
SET default_table_access_method = heap;

-- Create notifications table
CREATE TABLE public.notifications (
    id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    user_id bigint,
    thread_id bigint,
    reply_id bigint,
    type text,
    read boolean,
    data jsonb
);

ALTER TABLE public.notifications OWNER TO forumuser;

-- Create notifications sequence
CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.notifications_id_seq OWNER TO forumuser;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

-- Create replies table
CREATE TABLE public.replies (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    content text,
    thread_id bigint,
    user_id bigint
);

ALTER TABLE public.replies OWNER TO forumuser;

-- Create replies sequence
CREATE SEQUENCE public.replies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.replies_id_seq OWNER TO forumuser;
ALTER SEQUENCE public.replies_id_seq OWNED BY public.replies.id;

-- Create roles table
CREATE TABLE public.roles (
    id integer NOT NULL,
    name text,
    color text,
    permissions jsonb NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);

ALTER TABLE public.roles OWNER TO forumuser;

-- Create roles sequence
CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.roles_id_seq OWNER TO forumuser;
ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

-- Create thread_subscriptions table
CREATE TABLE public.thread_subscriptions (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    user_id integer,
    thread_id integer,
    email_notifications boolean DEFAULT true
);

ALTER TABLE public.thread_subscriptions OWNER TO forumuser;

-- Create thread_subscriptions sequence
CREATE SEQUENCE public.thread_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.thread_subscriptions_id_seq OWNER TO forumuser;
ALTER SEQUENCE public.thread_subscriptions_id_seq OWNED BY public.thread_subscriptions.id;

-- Create threads table
CREATE TABLE public.threads (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    title text,
    content text,
    section text,
    tags text,
    views bigint,
    user_id bigint
);

ALTER TABLE public.threads OWNER TO forumuser;

-- Create threads sequence
CREATE SEQUENCE public.threads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.threads_id_seq OWNER TO forumuser;
ALTER SEQUENCE public.threads_id_seq OWNED BY public.threads.id;

-- Create users table
CREATE TABLE public.users (
    id bigint NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    email text,
    name text,
    password text,
    role text,
    verified boolean,
    verify_token text,
    verify_expires timestamp with time zone,
    role_color character varying(7) DEFAULT '#808080'::character varying,
    total_threads integer DEFAULT 0,
    total_replies integer DEFAULT 0,
    last_active timestamp with time zone,
    join_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    role_id bigint
);

ALTER TABLE public.users OWNER TO forumuser;

-- Create users sequence
CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.users_id_seq OWNER TO forumuser;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- Set default values for IDs
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
ALTER TABLE ONLY public.replies ALTER COLUMN id SET DEFAULT nextval('public.replies_id_seq'::regclass);
ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);
ALTER TABLE ONLY public.thread_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.thread_subscriptions_id_seq'::regclass);
ALTER TABLE ONLY public.threads ALTER COLUMN id SET DEFAULT nextval('public.threads_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- Add primary keys
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.replies ADD CONSTRAINT replies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.thread_subscriptions ADD CONSTRAINT thread_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.thread_subscriptions ADD CONSTRAINT thread_subscriptions_user_id_thread_id_key UNIQUE (user_id, thread_id);
ALTER TABLE ONLY public.threads ADD CONSTRAINT threads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Create indexes
CREATE INDEX idx_replies_deleted_at ON public.replies USING btree (deleted_at);
CREATE INDEX idx_roles_deleted_at ON public.roles USING btree (deleted_at);
CREATE INDEX idx_threads_deleted_at ON public.threads USING btree (deleted_at);
CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);

-- Add foreign key constraints
ALTER TABLE ONLY public.replies ADD CONSTRAINT fk_threads_replies FOREIGN KEY (thread_id) REFERENCES public.threads(id);
ALTER TABLE ONLY public.replies ADD CONSTRAINT fk_users_replies FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE ONLY public.threads ADD CONSTRAINT fk_users_threads FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_reply_id_fkey FOREIGN KEY (reply_id) REFERENCES public.replies(id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.thread_subscriptions ADD CONSTRAINT thread_subscriptions_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id);
ALTER TABLE ONLY public.thread_subscriptions ADD CONSTRAINT thread_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);

-- Insert default roles
INSERT INTO public.roles (id, name, color, permissions, created_at, updated_at, deleted_at) VALUES
(1, 'admin', '#FF4444', '{"can_pin_threads": true, "can_manage_roles": true, "can_manage_users": true, "can_delete_threads": true}', '2024-12-22 20:22:51.10418+00', '2024-12-22 20:22:51.10418+00', NULL),
(2, 'moderator', '#44AA44', '{"can_pin_threads": true, "can_manage_users": false, "can_delete_threads": true}', '2024-12-22 20:22:51.10418+00', '2024-12-22 20:22:51.10418+00', NULL),
(3, 'verified_member', '#4444FF', '{"can_reply": true, "can_create_threads": true}', '2024-12-22 20:22:51.10418+00', '2024-12-22 20:22:51.10418+00', NULL),
(4, 'member', '#808080', '{"can_reply": true, "can_create_threads": true}', '2024-12-22 20:22:51.10418+00', '2024-12-22 20:22:51.10418+00', NULL),
(5, 'guest', '#A0A0A0', '{"can_reply": false, "can_create_threads": false}', '2024-12-22 20:22:51.10418+00', '2024-12-22 20:22:51.10418+00', NULL);

-- Set sequence values
SELECT pg_catalog.setval('public.notifications_id_seq', 19, true);
SELECT pg_catalog.setval('public.replies_id_seq', 195, true);
SELECT pg_catalog.setval('public.roles_id_seq', 8, true);
SELECT pg_catalog.setval('public.thread_subscriptions_id_seq', 5, true);
SELECT pg_catalog.setval('public.threads_id_seq', 7, true);
SELECT pg_catalog.setval('public.users_id_seq', 5, true);

-- Create Admin
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@student.gla.ac.uk') THEN
        INSERT INTO public.users (
            email,
            name,
            password,
            role_id,
            verified,
            created_at,
            updated_at,
            join_date,
            role_color
        ) VALUES (
            'admin@student.gla.ac.uk',
            'Admin User',
            '$2a$14$y/v.QjgSelJGicRiyLJbuODxJ7VlzlwDIBwG6OVeLMfnJE9hAmzRG', -- admin123
            1, -- admin role_id
            true, -- verified
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            '#FF4444' -- admin color
        );
    END IF;
END $$;
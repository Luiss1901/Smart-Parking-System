--
-- PostgreSQL database dump
--

\restrict 4OnGY79OR6jshThZcecZtjtQZrzPiygoS6pqVcLk8WDJZ1jzngBwMqoGJSl2ca0

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: slots; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.slots (
    id integer NOT NULL,
    code text,
    status text
);


ALTER TABLE public.slots OWNER TO myuser;

--
-- Name: slots_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.slots_id_seq OWNER TO myuser;

--
-- Name: slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.slots_id_seq OWNED BY public.slots.id;


--
-- Name: slots id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.slots ALTER COLUMN id SET DEFAULT nextval('public.slots_id_seq'::regclass);


--
-- Data for Name: slots; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public.slots (id, code, status) FROM stdin;
2	A02	AVAILABLE
3	A03	OCCUPIED
4	B01	AVAILABLE
1	A01	RESERVED
\.


--
-- Name: slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myuser
--

SELECT pg_catalog.setval('public.slots_id_seq', 4, true);


--
-- Name: slots slots_code_key; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_code_key UNIQUE (code);


--
-- Name: slots slots_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 4OnGY79OR6jshThZcecZtjtQZrzPiygoS6pqVcLk8WDJZ1jzngBwMqoGJSl2ca0


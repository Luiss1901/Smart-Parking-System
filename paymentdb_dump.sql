--
-- PostgreSQL database dump
--

\restrict jhi4ZHCu5sDScGACtp4ryzntr6ei5awgbaS2a3YJtasH700FlLORtMJYl05JvTZ

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
-- Name: payments; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    "bookingId" integer,
    amount real,
    "usdAmount" text,
    "exchangeRate" text,
    status text,
    "vietQrUrl" text,
    "paidAt" text,
    "txnRef" text,
    "userId" integer
);


ALTER TABLE public.payments OWNER TO myuser;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO myuser;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public.payments (id, "bookingId", amount, "usdAmount", "exchangeRate", status, "vietQrUrl", "paidAt", "txnRef", "userId") FROM stdin;
1	1	40000	0	0	PENDING		\N	1_1783730014029	\N
\.


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myuser
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, true);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_txnRef_key; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_txnRef_key" UNIQUE ("txnRef");


--
-- Name: idx_payments_userid; Type: INDEX; Schema: public; Owner: myuser
--

CREATE INDEX idx_payments_userid ON public.payments USING btree ("userId");


--
-- PostgreSQL database dump complete
--

\unrestrict jhi4ZHCu5sDScGACtp4ryzntr6ei5awgbaS2a3YJtasH700FlLORtMJYl05JvTZ


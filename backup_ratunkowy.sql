--
-- PostgreSQL database dump
--

\restrict S66xJXfyPnc07JsZ641jPWhgOvl4ueDCaXar2I72sIOC8SjEyRRm7WYKTDSO6H4

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: app
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO app;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: app
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO app;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: app
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    used_word_ids text DEFAULT '[]'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_accessed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO app;

--
-- Name: words; Type: TABLE; Schema: public; Owner: app
--

CREATE TABLE public.words (
    id integer NOT NULL,
    polish character varying(500) NOT NULL,
    english character varying(500) NOT NULL,
    category_id integer NOT NULL,
    difficulty integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.words OWNER TO app;

--
-- Name: words_id_seq; Type: SEQUENCE; Schema: public; Owner: app
--

CREATE SEQUENCE public.words_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.words_id_seq OWNER TO app;

--
-- Name: words_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app
--

ALTER SEQUENCE public.words_id_seq OWNED BY public.words.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: app
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: words id; Type: DEFAULT; Schema: public; Owner: app
--

ALTER TABLE ONLY public.words ALTER COLUMN id SET DEFAULT nextval('public.words_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: app
--

COPY public.categories (id, name, created_at) FROM stdin;
1	kolokacje	2026-01-21 06:36:59.3987
2	A1	2026-01-21 06:36:59.3987
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: app
--

COPY public.sessions (id, used_word_ids, created_at, last_accessed_at) FROM stdin;
sess_84d1bf76-ac41-41ed-af1c-0f981cce4767	["75","41","10","29","4"]	2026-01-24 19:46:54.504	2026-02-10 18:10:35.063
\.


--
-- Data for Name: words; Type: TABLE DATA; Schema: public; Owner: app
--

COPY public.words (id, polish, english, category_id, difficulty, created_at) FROM stdin;
1	podjąć decyzję	make a decision	1	2	2026-01-21 06:36:59.414811
2	dojść do wniosku	reach a conclusion	1	2	2026-01-21 06:36:59.414811
3	mieć opinię / pogląd	hold an opinion	1	2	2026-01-21 06:36:59.414811
4	poruszyć problem / kwestię	raise an issue	1	2	2026-01-21 06:36:59.414811
5	wziąć coś pod uwagę	take something into account	1	2	2026-01-21 06:36:59.414811
6	wyrazić zaniepokojenie	express concern	1	2	2026-01-21 06:36:59.414811
7	zwrócić uwagę na	draw attention to	1	2	2026-01-21 06:36:59.414811
8	mieć mieszane uczucia	have mixed feelings	1	2	2026-01-21 06:36:59.414811
9	być pod wrażeniem / sądzić, że	be under the impression	1	3	2026-01-21 06:36:59.414811
10	z mojej perspektywy	from my perspective	1	2	2026-01-21 06:36:59.414811
11	dotrzymać terminu	meet a deadline	1	2	2026-01-21 06:36:59.414811
12	wziąć odpowiedzialność za	take responsibility for	1	2	2026-01-21 06:36:59.414811
13	dojść do porozumienia	come to an agreement	1	2	2026-01-21 06:36:59.414811
14	przeprowadzić badania	carry out research	1	2	2026-01-21 06:36:59.414811
15	odgrywać kluczową rolę	play a key role	1	2	2026-01-21 06:36:59.414811
16	zdobywać doświadczenie	gain experience	1	2	2026-01-21 06:36:59.414811
17	wysoko wykwalifikowany	highly skilled	1	2	2026-01-21 06:36:59.414811
18	przewaga konkurencyjna	competitive advantage	1	3	2026-01-21 06:36:59.414811
19	długoterminowy cel	long-term goal	1	2	2026-01-21 06:36:59.414811
20	pracować pod presją	work under pressure	1	2	2026-01-21 06:36:59.414811
21	budować zaufanie	build trust	1	2	2026-01-21 06:36:59.414811
22	stracić cierpliwość	lose patience	1	2	2026-01-21 06:36:59.414811
23	czuć się swobodnie	feel at ease	1	2	2026-01-21 06:36:59.414811
24	wyrazić wdzięczność	express gratitude	1	2	2026-01-21 06:36:59.414811
25	wzajemny szacunek	mutual respect	1	2	2026-01-21 06:36:59.414811
26	silna więź	strong bond	1	2	2026-01-21 06:36:59.414811
27	poczucie przynależności	sense of belonging	1	3	2026-01-21 06:36:59.414811
28	wsparcie emocjonalne	emotional support	1	2	2026-01-21 06:36:59.414811
29	głęboko zaniepokojony	deeply concerned	1	2	2026-01-21 06:36:59.414811
30	brać coś do siebie	take something personally	1	2	2026-01-21 06:36:59.414811
31	postarać się / włożyć wysiłek	make an effort	1	2	2026-01-21 06:36:59.414811
32	pogodzić się z (czymś)	come to terms with	1	3	2026-01-21 06:36:59.414811
33	mieć na uwadze / pamiętać	bear in mind	1	2	2026-01-21 06:36:59.414811
34	przypadkiem	by coincidence	1	2	2026-01-21 06:36:59.414811
35	na dłuższą metę	in the long run	1	2	2026-01-21 06:36:59.414811
36	w krótkim terminie / na ostatnią chwilę	at short notice	1	3	2026-01-21 06:36:59.414811
37	do pewnego stopnia	to some extent	1	2	2026-01-21 06:36:59.414811
38	ogólnie rzecz biorąc	on the whole	1	2	2026-01-21 06:36:59.414811
39	w rzeczywistości / tak naprawdę	as a matter of fact	1	2	2026-01-21 06:36:59.414811
40	na razie / tymczasowo	for the time being	1	2	2026-01-21 06:36:59.414811
41	nie da się zaprzeczyć, że	there is no denying that	1	3	2026-01-21 06:36:59.414811
42	oczywiste jest, że	it goes without saying that	1	3	2026-01-21 06:36:59.414811
43	można by argumentować, że	one could argue that	1	3	2026-01-21 06:36:59.414811
44	trafny przykład	a case in point	1	3	2026-01-21 06:36:59.414811
45	rzucić światło na / wyjaśnić	shed light on	1	3	2026-01-21 06:36:59.414811
46	na podstawie tego, że	on the grounds that	1	3	2026-01-21 06:36:59.414811
47	z szerszej perspektywy	from a broader perspective	1	3	2026-01-21 06:36:59.414811
48	być otwartym na zmiany	be open to change	1	2	2026-01-21 06:36:59.414811
49	stanowić wyzwanie	pose a challenge	1	3	2026-01-21 06:36:59.414811
50	mieć daleko idące konsekwencje	have far-reaching consequences	1	3	2026-01-21 06:36:59.414811
51	dom	house	2	1	2026-01-21 06:36:59.414811
52	rodzina	family	2	1	2026-01-21 06:36:59.414811
53	woda	water	2	1	2026-01-21 06:36:59.414811
54	jedzenie	food	2	1	2026-01-21 06:36:59.414811
55	książka	book	2	1	2026-01-21 06:36:59.414811
56	szkoła	school	2	1	2026-01-21 06:36:59.414811
57	praca	work	2	1	2026-01-21 06:36:59.414811
58	dzień	day	2	1	2026-01-21 06:36:59.414811
59	noc	night	2	1	2026-01-21 06:36:59.414811
60	czas	time	2	1	2026-01-21 06:36:59.414811
61	przyjaciel	friend	2	1	2026-01-21 06:36:59.414811
62	miasto	city	2	1	2026-01-21 06:36:59.414811
63	ulica	street	2	1	2026-01-21 06:36:59.414811
64	samochód	car	2	1	2026-01-21 06:36:59.414811
65	telefon	phone	2	1	2026-01-21 06:36:59.414811
66	duży	big	2	1	2026-01-21 06:36:59.414811
67	mały	small	2	1	2026-01-21 06:36:59.414811
68	dobry	good	2	1	2026-01-21 06:36:59.414811
69	zły	bad	2	1	2026-01-21 06:36:59.414811
70	nowy	new	2	1	2026-01-21 06:36:59.414811
71	stary	old	2	1	2026-01-21 06:36:59.414811
72	młody	young	2	1	2026-01-21 06:36:59.414811
73	gorący	hot	2	1	2026-01-21 06:36:59.414811
74	zimny	cold	2	1	2026-01-21 06:36:59.414811
75	szczęśliwy	happy	2	1	2026-01-21 06:36:59.414811
76	smutny	sad	2	1	2026-01-21 06:36:59.414811
77	jeść	to eat	2	1	2026-01-21 06:36:59.414811
78	pić	to drink	2	1	2026-01-21 06:36:59.414811
79	spać	to sleep	2	1	2026-01-21 06:36:59.414811
80	iść	to go	2	1	2026-01-21 06:36:59.414811
81	mówić	to speak	2	1	2026-01-21 06:36:59.414811
82	czytać	to read	2	1	2026-01-21 06:36:59.414811
83	pisać	to write	2	1	2026-01-21 06:36:59.414811
84	słuchać	to listen	2	1	2026-01-21 06:36:59.414811
85	rozumieć	to understand	2	1	2026-01-21 06:36:59.414811
86	widzieć	to see	2	1	2026-01-21 06:36:59.414811
87	dzisiaj	today	2	1	2026-01-21 06:36:59.414811
88	jutro	tomorrow	2	1	2026-01-21 06:36:59.414811
89	wczoraj	yesterday	2	1	2026-01-21 06:36:59.414811
90	teraz	now	2	1	2026-01-21 06:36:59.414811
91	zawsze	always	2	1	2026-01-21 06:36:59.414811
92	nigdy	never	2	1	2026-01-21 06:36:59.414811
93	często	often	2	1	2026-01-21 06:36:59.414811
94	czasami	sometimes	2	1	2026-01-21 06:36:59.414811
95	tutaj	here	2	1	2026-01-21 06:36:59.414811
96	tam	there	2	1	2026-01-21 06:36:59.414811
97	pieniądze	money	2	1	2026-01-21 06:36:59.414811
98	sklep	shop	2	1	2026-01-21 06:36:59.414811
99	pogoda	weather	2	1	2026-01-21 06:36:59.414811
100	rok	year	2	1	2026-01-21 06:36:59.414811
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: app
--

SELECT pg_catalog.setval('public.categories_id_seq', 2, true);


--
-- Name: words_id_seq; Type: SEQUENCE SET; Schema: public; Owner: app
--

SELECT pg_catalog.setval('public.words_id_seq', 100, true);


--
-- Name: categories categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: app
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: app
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: app
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: words words_pkey; Type: CONSTRAINT; Schema: public; Owner: app
--

ALTER TABLE ONLY public.words
    ADD CONSTRAINT words_pkey PRIMARY KEY (id);


--
-- Name: words words_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: app
--

ALTER TABLE ONLY public.words
    ADD CONSTRAINT words_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict S66xJXfyPnc07JsZ641jPWhgOvl4ueDCaXar2I72sIOC8SjEyRRm7WYKTDSO6H4


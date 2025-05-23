PGDMP      8                }            postwork    17.4    17.4 B               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    16388    postwork    DATABASE     n   CREATE DATABASE postwork WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'ru-RU';
    DROP DATABASE postwork;
                     postgres    false                        2615    16510    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                     postgres    false                       0    0    SCHEMA public    COMMENT         COMMENT ON SCHEMA public IS '';
                        postgres    false    5                       0    0    SCHEMA public    ACL     +   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
                        postgres    false    5            c           1247    16548    TaskPriority    TYPE     S   CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);
 !   DROP TYPE public."TaskPriority";
       public               postgres    false    5            `           1247    16536 
   TaskStatus    TYPE     |   CREATE TYPE public."TaskStatus" AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'PROBLEM',
    'COMPLETED',
    'CANCELLED'
);
    DROP TYPE public."TaskStatus";
       public               postgres    false    5            ]           1247    16526    UserRole    TYPE     b   CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'MANAGER',
    'DESIGNER'
);
    DROP TYPE public."UserRole";
       public               postgres    false    5            �            1259    16579    Comment    TABLE       CREATE TABLE public."Comment" (
    id integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "taskId" integer,
    "authorId" integer
);
    DROP TABLE public."Comment";
       public         heap r       postgres    false    5            �            1259    16578    Comment_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public."Comment_id_seq";
       public               postgres    false    223    5                       0    0    Comment_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public."Comment_id_seq" OWNED BY public."Comment".id;
          public               postgres    false    222            �            1259    16598 
   Department    TABLE     V   CREATE TABLE public."Department" (
    id integer NOT NULL,
    name text NOT NULL
);
     DROP TABLE public."Department";
       public         heap r       postgres    false    5            �            1259    16597    Department_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Department_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public."Department_id_seq";
       public               postgres    false    5    227                       0    0    Department_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public."Department_id_seq" OWNED BY public."Department".id;
          public               postgres    false    226            �            1259    16589    Project    TABLE     �   CREATE TABLE public."Project" (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    client text NOT NULL
);
    DROP TABLE public."Project";
       public         heap r       postgres    false    5            �            1259    16588    Project_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Project_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public."Project_id_seq";
       public               postgres    false    225    5                       0    0    Project_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public."Project_id_seq" OWNED BY public."Project".id;
          public               postgres    false    224            �            1259    16567    Task    TABLE     �  CREATE TABLE public."Task" (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    priority public."TaskPriority" DEFAULT 'LOW'::public."TaskPriority" NOT NULL,
    status public."TaskStatus" DEFAULT 'TODO'::public."TaskStatus" NOT NULL,
    deadline timestamp(3) without time zone,
    "projectId" integer,
    "assigneeId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."Task";
       public         heap r       postgres    false    867    864    867    5    864            �            1259    16566    Task_id_seq    SEQUENCE     �   CREATE SEQUENCE public."Task_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."Task_id_seq";
       public               postgres    false    221    5                       0    0    Task_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."Task_id_seq" OWNED BY public."Task".id;
          public               postgres    false    220            �            1259    16556    User    TABLE     k  CREATE TABLE public."User" (
    id integer NOT NULL,
    login text NOT NULL,
    password text NOT NULL,
    "departmentId" integer,
    role public."UserRole" DEFAULT 'USER'::public."UserRole",
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."User";
       public         heap r       postgres    false    861    861    5            �            1259    16555    User_id_seq    SEQUENCE     �   CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public."User_id_seq";
       public               postgres    false    219    5                       0    0    User_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;
          public               postgres    false    218            �            1259    16666    _DepartmentToProject    TABLE     c   CREATE TABLE public."_DepartmentToProject" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);
 *   DROP TABLE public."_DepartmentToProject";
       public         heap r       postgres    false    5            �            1259    16606    _ProjectToUser    TABLE     ]   CREATE TABLE public."_ProjectToUser" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);
 $   DROP TABLE public."_ProjectToUser";
       public         heap r       postgres    false    5            �            1259    16511    _prisma_migrations    TABLE     �  CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);
 &   DROP TABLE public._prisma_migrations;
       public         heap r       postgres    false    5            S           2604    16582 
   Comment id    DEFAULT     l   ALTER TABLE ONLY public."Comment" ALTER COLUMN id SET DEFAULT nextval('public."Comment_id_seq"'::regclass);
 ;   ALTER TABLE public."Comment" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    222    223    223            V           2604    16601    Department id    DEFAULT     r   ALTER TABLE ONLY public."Department" ALTER COLUMN id SET DEFAULT nextval('public."Department_id_seq"'::regclass);
 >   ALTER TABLE public."Department" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    227    226    227            U           2604    16592 
   Project id    DEFAULT     l   ALTER TABLE ONLY public."Project" ALTER COLUMN id SET DEFAULT nextval('public."Project_id_seq"'::regclass);
 ;   ALTER TABLE public."Project" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    225    225            O           2604    16570    Task id    DEFAULT     f   ALTER TABLE ONLY public."Task" ALTER COLUMN id SET DEFAULT nextval('public."Task_id_seq"'::regclass);
 8   ALTER TABLE public."Task" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    220    221    221            L           2604    16559    User id    DEFAULT     f   ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);
 8   ALTER TABLE public."User" ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    218    219            
          0    16579    Comment 
   TABLE DATA           `   COPY public."Comment" (id, content, "createdAt", "updatedAt", "taskId", "authorId") FROM stdin;
    public               postgres    false    223   �P                 0    16598 
   Department 
   TABLE DATA           0   COPY public."Department" (id, name) FROM stdin;
    public               postgres    false    227   �P                 0    16589    Project 
   TABLE DATA           [   COPY public."Project" (id, title, description, "startDate", "endDate", client) FROM stdin;
    public               postgres    false    225   0Q                 0    16567    Task 
   TABLE DATA           �   COPY public."Task" (id, title, description, priority, status, deadline, "projectId", "assigneeId", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    221   �Q                 0    16556    User 
   TABLE DATA           k   COPY public."User" (id, login, password, "departmentId", role, name, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    219   �Q                 0    16666    _DepartmentToProject 
   TABLE DATA           :   COPY public."_DepartmentToProject" ("A", "B") FROM stdin;
    public               postgres    false    229   �R                 0    16606    _ProjectToUser 
   TABLE DATA           4   COPY public."_ProjectToUser" ("A", "B") FROM stdin;
    public               postgres    false    228    S                 0    16511    _prisma_migrations 
   TABLE DATA           �   COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
    public               postgres    false    217   ,S                  0    0    Comment_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public."Comment_id_seq"', 1, false);
          public               postgres    false    222                       0    0    Department_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public."Department_id_seq"', 4, true);
          public               postgres    false    226                        0    0    Project_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public."Project_id_seq"', 5, true);
          public               postgres    false    224            !           0    0    Task_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public."Task_id_seq"', 1, false);
          public               postgres    false    220            "           0    0    User_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public."User_id_seq"', 2, true);
          public               postgres    false    218            _           2606    16587    Comment Comment_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);
 B   ALTER TABLE ONLY public."Comment" DROP CONSTRAINT "Comment_pkey";
       public                 postgres    false    223            c           2606    16605    Department Department_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."Department" DROP CONSTRAINT "Department_pkey";
       public                 postgres    false    227            a           2606    16596    Project Project_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);
 B   ALTER TABLE ONLY public."Project" DROP CONSTRAINT "Project_pkey";
       public                 postgres    false    225            ]           2606    16577    Task Task_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."Task" DROP CONSTRAINT "Task_pkey";
       public                 postgres    false    221            [           2606    16565    User User_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
       public                 postgres    false    219            h           2606    16670 1   _DepartmentToProject _DepartmentToProject_AB_pkey 
   CONSTRAINT     y   ALTER TABLE ONLY public."_DepartmentToProject"
    ADD CONSTRAINT "_DepartmentToProject_AB_pkey" PRIMARY KEY ("A", "B");
 _   ALTER TABLE ONLY public."_DepartmentToProject" DROP CONSTRAINT "_DepartmentToProject_AB_pkey";
       public                 postgres    false    229    229            e           2606    16610 %   _ProjectToUser _ProjectToUser_AB_pkey 
   CONSTRAINT     m   ALTER TABLE ONLY public."_ProjectToUser"
    ADD CONSTRAINT "_ProjectToUser_AB_pkey" PRIMARY KEY ("A", "B");
 S   ALTER TABLE ONLY public."_ProjectToUser" DROP CONSTRAINT "_ProjectToUser_AB_pkey";
       public                 postgres    false    228    228            X           2606    16519 *   _prisma_migrations _prisma_migrations_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
       public                 postgres    false    217            Y           1259    16611    User_login_key    INDEX     K   CREATE UNIQUE INDEX "User_login_key" ON public."User" USING btree (login);
 $   DROP INDEX public."User_login_key";
       public                 postgres    false    219            i           1259    16671    _DepartmentToProject_B_index    INDEX     `   CREATE INDEX "_DepartmentToProject_B_index" ON public."_DepartmentToProject" USING btree ("B");
 2   DROP INDEX public."_DepartmentToProject_B_index";
       public                 postgres    false    229            f           1259    16612    _ProjectToUser_B_index    INDEX     T   CREATE INDEX "_ProjectToUser_B_index" ON public."_ProjectToUser" USING btree ("B");
 ,   DROP INDEX public."_ProjectToUser_B_index";
       public                 postgres    false    228            m           2606    16633    Comment Comment_authorId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 K   ALTER TABLE ONLY public."Comment" DROP CONSTRAINT "Comment_authorId_fkey";
       public               postgres    false    219    223    4699            n           2606    16628    Comment Comment_taskId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 I   ALTER TABLE ONLY public."Comment" DROP CONSTRAINT "Comment_taskId_fkey";
       public               postgres    false    4701    223    221            k           2606    16623    Task Task_assigneeId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 G   ALTER TABLE ONLY public."Task" DROP CONSTRAINT "Task_assigneeId_fkey";
       public               postgres    false    221    4699    219            l           2606    16618    Task Task_projectId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 F   ALTER TABLE ONLY public."Task" DROP CONSTRAINT "Task_projectId_fkey";
       public               postgres    false    221    4705    225            j           2606    16613    User User_departmentId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 I   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_departmentId_fkey";
       public               postgres    false    4707    219    227            q           2606    16672 0   _DepartmentToProject _DepartmentToProject_A_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."_DepartmentToProject"
    ADD CONSTRAINT "_DepartmentToProject_A_fkey" FOREIGN KEY ("A") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public."_DepartmentToProject" DROP CONSTRAINT "_DepartmentToProject_A_fkey";
       public               postgres    false    229    4707    227            r           2606    16677 0   _DepartmentToProject _DepartmentToProject_B_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."_DepartmentToProject"
    ADD CONSTRAINT "_DepartmentToProject_B_fkey" FOREIGN KEY ("B") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public."_DepartmentToProject" DROP CONSTRAINT "_DepartmentToProject_B_fkey";
       public               postgres    false    4705    225    229            o           2606    16643 $   _ProjectToUser _ProjectToUser_A_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."_ProjectToUser"
    ADD CONSTRAINT "_ProjectToUser_A_fkey" FOREIGN KEY ("A") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;
 R   ALTER TABLE ONLY public."_ProjectToUser" DROP CONSTRAINT "_ProjectToUser_A_fkey";
       public               postgres    false    225    4705    228            p           2606    16648 $   _ProjectToUser _ProjectToUser_B_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."_ProjectToUser"
    ADD CONSTRAINT "_ProjectToUser_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
 R   ALTER TABLE ONLY public."_ProjectToUser" DROP CONSTRAINT "_ProjectToUser_B_fkey";
       public               postgres    false    219    228    4699            
      x������ � �         B   x�3估�¬�.��2⼰�����A�M�/l���b�Ŧ��\&�@%�.,��*�\1z\\\ � m         �   x����	�0E��Y����{�,�����	r	��$+|mTS���FO<}y�;;m4U��Mt��^��8D���r���7;��ra��}�;jb+(��!�!����arY,Z@�0H]�`v$�ޯr>���0��            x������ � �         �   x�3�,KL�L�T1JR14PI�	�00͵L�M4ɏ�3�7J��0IOs	4��2q31����ʉ�2�,7t	/�4�v�0�[.츰�����T��T��@��������X����8�giqj��z��ƙ&�y���9���9Ņ�!.��i�%��>F�)&y����9z�f.���FPW,���b��&t���L���L�p�s��qqq t�L            x�3�4�2�4b.# 6�4����� '�            x�3�4�2�4�2b 6�=... '�         �   x�m�1�0@ѹ9;J�8������ta($�eF��׫¶Y+�q$�M���j�:J�za���&���eTr'?�'*�k7����4�F�%��R��#|��p�k�X��w�AA����z�۴^���T��:�>�0     
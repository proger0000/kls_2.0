-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.academy_attendance (
  id integer NOT NULL,
  candidate_id integer NOT NULL,
  attendance_date date NOT NULL,
  status character varying,
  marked_by_user_id integer,
  created_at timestamp without time zone,
  CONSTRAINT academy_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT fk_attendance_candidate FOREIGN KEY (candidate_id) REFERENCES public.academy_candidates(id),
  CONSTRAINT fk_attendance_marker FOREIGN KEY (marked_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.academy_candidates (
  id integer NOT NULL,
  full_name character varying,
  group_id integer,
  status character varying,
  enrollment_date date,
  notes text,
  linked_user_id integer,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT academy_candidates_pkey PRIMARY KEY (id),
  CONSTRAINT fk_candidates_group FOREIGN KEY (group_id) REFERENCES public.academy_groups(id),
  CONSTRAINT fk_candidates_user FOREIGN KEY (linked_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.academy_groups (
  id integer NOT NULL,
  name character varying,
  trainer_user_id integer,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT academy_groups_pkey PRIMARY KEY (id),
  CONSTRAINT fk_academy_groups_trainer FOREIGN KEY (trainer_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.academy_standard_results (
  id integer NOT NULL,
  candidate_id integer NOT NULL,
  standard_type_id integer NOT NULL,
  attempt_date date NOT NULL,
  result_value character varying,
  passed integer,
  comments text,
  marked_by_user_id integer,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT academy_standard_results_pkey PRIMARY KEY (id),
  CONSTRAINT fk_std_results_candidate FOREIGN KEY (candidate_id) REFERENCES public.academy_candidates(id),
  CONSTRAINT fk_std_results_type FOREIGN KEY (standard_type_id) REFERENCES public.academy_standard_types(id),
  CONSTRAINT fk_std_results_marker FOREIGN KEY (marked_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.academy_standard_types (
  id integer NOT NULL,
  name character varying,
  description text,
  pass_criteria character varying,
  is_active integer NOT NULL,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT academy_standard_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.academy_tests (
  id integer NOT NULL,
  candidate_id integer NOT NULL,
  test_date date NOT NULL,
  score numeric,
  comments text,
  marked_by_user_id integer,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT academy_tests_pkey PRIMARY KEY (id),
  CONSTRAINT fk_tests_candidate FOREIGN KEY (candidate_id) REFERENCES public.academy_candidates(id),
  CONSTRAINT fk_tests_marker FOREIGN KEY (marked_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.action_log (
  id integer NOT NULL,
  user_id integer NOT NULL,
  action_description character varying,
  target_shift_id integer,
  details text,
  timestamp timestamp without time zone NOT NULL,
  CONSTRAINT action_log_pkey PRIMARY KEY (id),
  CONSTRAINT fk_action_log_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_action_log_shift FOREIGN KEY (target_shift_id) REFERENCES public.shifts(id)
);
CREATE TABLE public.beach_analytics_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  date date NOT NULL,
  time_slot text NOT NULL,
  post_id integer,
  land_count integer DEFAULT 0,
  water_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT beach_analytics_logs_pkey PRIMARY KEY (id),
  CONSTRAINT beach_analytics_logs_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.contact_messages (
  id integer NOT NULL,
  name character varying,
  email character varying,
  message text,
  received_at timestamp without time zone NOT NULL,
  is_read integer,
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.junior_applications (
  id integer NOT NULL,
  parent_name character varying,
  parent_phone character varying,
  parent_email character varying,
  child_name character varying,
  child_birthdate date NOT NULL,
  sport_engagement character varying,
  sport_details character varying,
  can_swim character varying,
  swim_level integer,
  registration_datetime timestamp without time zone NOT NULL,
  CONSTRAINT junior_applications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lifeguard_applications (
  id integer NOT NULL,
  fname character varying,
  name character varying,
  lname character varying,
  phone character varying,
  email character varying,
  birth_date date NOT NULL,
  status character varying,
  manager_note text,
  comments_history text,
  history text,
  manager_name character varying,
  manager_id integer,
  registration_datetime timestamp without time zone NOT NULL,
  updated_at timestamp without time zone NOT NULL,
  CONSTRAINT lifeguard_applications_pkey PRIMARY KEY (id),
  CONSTRAINT fk_applications_manager FOREIGN KEY (manager_id) REFERENCES public.users(id)
);
CREATE TABLE public.lifeguard_shift_points (
  id integer NOT NULL,
  shift_id integer NOT NULL,
  user_id integer NOT NULL,
  rule_id integer NOT NULL,
  points_awarded integer NOT NULL,
  base_points_from_rule integer NOT NULL,
  coefficient_applied numeric,
  awarded_by_user_id integer,
  award_datetime timestamp without time zone,
  comment text,
  CONSTRAINT lifeguard_shift_points_pkey PRIMARY KEY (id),
  CONSTRAINT fk_lsp_shift FOREIGN KEY (shift_id) REFERENCES public.shifts(id),
  CONSTRAINT fk_lsp_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_lsp_rule FOREIGN KEY (rule_id) REFERENCES public.points(id_balls),
  CONSTRAINT fk_lsp_awarded_by FOREIGN KEY (awarded_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.new2024 (
  id integer NOT NULL,
  fname character varying,
  name character varying,
  lname character varying,
  phone character varying,
  email character varying,
  data date NOT NULL,
  registration_datetime timestamp without time zone,
  status character varying,
  manager_note text,
  manager_id integer,
  history text,
  manager_name character varying,
  comments_history text,
  CONSTRAINT new2024_pkey PRIMARY KEY (id),
  CONSTRAINT fk_new2024_manager FOREIGN KEY (manager_id) REFERENCES public.users(id)
);
CREATE TABLE public.points (
  id_balls integer NOT NULL,
  name_balls character varying,
  quantity integer NOT NULL,
  comment_balls text,
  CONSTRAINT points_pkey PRIMARY KEY (id_balls)
);
CREATE TABLE public.pool_bookings (
  id integer NOT NULL,
  applicant_phone character varying,
  training_date date NOT NULL,
  training_time character varying,
  created_at timestamp without time zone NOT NULL,
  CONSTRAINT pool_bookings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.posts (
  id integer NOT NULL,
  name character varying,
  location_description text,
  created_at timestamp without time zone NOT NULL,
  updated_at timestamp without time zone NOT NULL,
  complexity_coefficient numeric,
  CONSTRAINT posts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rate_history (
  id integer NOT NULL,
  user_id integer NOT NULL,
  old_rate numeric,
  new_rate numeric,
  changed_by_user_id integer,
  changed_at timestamp without time zone,
  CONSTRAINT rate_history_pkey PRIMARY KEY (id),
  CONSTRAINT fk_rate_history_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_rate_history_changer FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.report_incidents (
  id integer NOT NULL,
  shift_report_id integer NOT NULL,
  incident_type character varying,
  incident_time time without time zone,
  involved_lifeguard_id integer,
  subject_name character varying,
  subject_age integer,
  subject_gender character varying,
  subject_phone character varying,
  cause_details text,
  actions_taken text,
  outcome_details text,
  witness1_name character varying,
  witness1_phone character varying,
  witness2_name character varying,
  witness2_phone character varying,
  responding_unit_details character varying,
  incident_description text,
  CONSTRAINT fk_incidents_report FOREIGN KEY (shift_report_id) REFERENCES public.shift_reports(id),
  CONSTRAINT fk_incidents_lifeguard FOREIGN KEY (involved_lifeguard_id) REFERENCES public.users(id)
);
CREATE TABLE public.shift_reports (
  id integer NOT NULL,
  shift_id integer NOT NULL,
  report_submitted_at timestamp without time zone NOT NULL,
  reporter_user_id integer NOT NULL,
  suspicious_swimmers_count integer,
  visitor_inquiries_count integer,
  bridge_jumpers_count integer,
  alcohol_water_prevented_count integer,
  alcohol_drinking_prevented_count integer,
  watercraft_stopped_count integer,
  preventive_actions_count integer,
  educational_activities_count integer,
  people_on_beach_estimated integer,
  people_in_water_estimated integer,
  general_notes text,
  CONSTRAINT shift_reports_pkey PRIMARY KEY (id),
  CONSTRAINT fk_reports_shift FOREIGN KEY (shift_id) REFERENCES public.shifts(id),
  CONSTRAINT fk_reports_user FOREIGN KEY (reporter_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.shifts (
  id integer NOT NULL,
  activity_type character varying,
  user_id integer NOT NULL,
  post_id integer NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone,
  status character varying,
  manual_opened_by integer,
  manual_closed_by integer,
  manual_close_comment text,
  lifeguard_assignment_type integer,
  photo_close_path character varying,
  photo_close_approved integer,
  photo_close_uploaded_at timestamp without time zone,
  start_photo_path character varying,
  start_photo_approved_at timestamp without time zone,
  start_photo_approved_by integer,
  created_at timestamp without time zone NOT NULL,
  updated_at timestamp without time zone NOT NULL,
  rounded_work_hours integer,
  CONSTRAINT shifts_pkey PRIMARY KEY (id),
  CONSTRAINT fk_shifts_users FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_shifts_posts FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT fk_shifts_manual_closed_by FOREIGN KEY (manual_closed_by) REFERENCES public.users(id),
  CONSTRAINT fk_shifts_manual_opened_by FOREIGN KEY (manual_opened_by) REFERENCES public.users(id),
  CONSTRAINT fk_shifts_photo_approved_by FOREIGN KEY (start_photo_approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer NOT NULL,
  full_name character varying,
  email character varying,
  password_hash character varying,
  role character varying,
  created_at timestamp without time zone NOT NULL,
  updated_at timestamp without time zone NOT NULL,
  base_hourly_rate numeric,
  current_month_points integer,
  contract_number character varying,
  auth_id uuid UNIQUE,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
);
CREATE TABLE public.winter_stories (
  id integer NOT NULL,
  name character varying,
  age character varying,
  instagram character varying,
  school character varying,
  goes_on_ice character varying,
  knows_dangers character varying,
  help_action character varying,
  had_incidents character varying,
  story text,
  submission_datetime timestamp without time zone NOT NULL,
  CONSTRAINT winter_stories_pkey PRIMARY KEY (id)
);
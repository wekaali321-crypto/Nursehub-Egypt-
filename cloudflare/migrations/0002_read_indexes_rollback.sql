-- Rollback for 0002_read_indexes.sql (drops only the indexes it created; no data is touched).
DROP INDEX IF EXISTS idx_travel_q_cat_order;
DROP INDEX IF EXISTS idx_exam_q_exam_order;
DROP INDEX IF EXISTS idx_quiz_q_article;
DROP INDEX IF EXISTS idx_course_q_course_order;
DROP INDEX IF EXISTS idx_course_ch_course_order;
DROP INDEX IF EXISTS idx_drugs_slug;
DROP INDEX IF EXISTS idx_applied_pharm_part_order;
DROP INDEX IF EXISTS idx_travel_review_cat_order;
DROP INDEX IF EXISTS idx_interview_q_cat_order;
DROP INDEX IF EXISTS idx_exams_cat_order;
DROP INDEX IF EXISTS idx_site_pings_visitor;
DROP INDEX IF EXISTS idx_site_installs_created;

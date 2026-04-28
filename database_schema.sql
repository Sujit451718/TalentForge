CREATE DATABASE IF NOT EXISTS ai_interview_simulator;
USE ai_interview_simulator;

CREATE TABLE users (
  id CHAR(24) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  plan_type ENUM('free', 'premium') NOT NULL DEFAULT 'free',
  interview_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interviews (
  id CHAR(24) PRIMARY KEY,
  user_id CHAR(24) NOT NULL,
  role VARCHAR(120) NOT NULL,
  experience_level VARCHAR(50) NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'in-progress',
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_interviews_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE questions (
  id CHAR(24) PRIMARY KEY,
  interview_id CHAR(24) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  score DECIMAL(5,2),
  feedback TEXT,
  strengths JSON,
  weaknesses JSON,
  suggested_answer TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at DATETIME NULL,
  CONSTRAINT fk_questions_interview FOREIGN KEY (interview_id) REFERENCES interviews(id)
);

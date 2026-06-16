DROP TABLE IF EXISTS projects, contacts, stats, services CASCADE;

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stats (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  value INTEGER NOT NULL
);

INSERT INTO services (title, description) VALUES
('Web Design', 'Research-driven interfaces that convert. We handle wireframes through final UI, optimised for every breakpoint.'),
('Front-End Development', 'Production code that ships fast and runs faster. React, Next.js, animations, integrations — we build it all.'),
('Branding', 'Logos, type systems, color palettes, brand guides. Everything your brand needs to look sharp everywhere.');

INSERT INTO stats (label, value) VALUES
('Projects Completed', 150),
('Clients Worldwide', 50),
('Years Experience', 5);

INSERT INTO projects (title, category, image_url) VALUES
('Meridian Finance', 'Web Design', '/portfolio/meridian-finance.png'),
('Kuro Streetwear', 'Branding', '/portfolio/kuro-streetwear.png'),
('Apex Dashboard', 'Development', '/portfolio/apex-dashboard.png'),
('Nomad Travel Co', 'Web Design', '/portfolio/nomad-travel.png'),
('Volt Energy', 'Branding', '/portfolio/volt-energy.png'),
('CloudSync SaaS', 'Development', '/portfolio/cloudsync-saas.png');

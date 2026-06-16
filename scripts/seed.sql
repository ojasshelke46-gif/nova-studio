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
('Meridian Finance', 'Web Design', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop'),
('Kuro Streetwear', 'Branding', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop'),
('Apex Dashboard', 'Development', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'),
('Nomad Travel Co', 'Web Design', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop'),
('Volt Energy', 'Branding', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop'),
('CloudSync SaaS', 'Development', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop');

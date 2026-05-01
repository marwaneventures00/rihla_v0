-- Seed realistic Moroccan graduate tracking records for Observatoire
-- Safe to run multiple times: inserts only if linkedin_url is new.

begin;

insert into public.universities (name, access_code, admin_email, license_active, student_count)
select x.name, x.access_code, null, true, 1000
from (
  values
    ('ESCA Ecole de Management', 'ESCA-OBS-2026'),
    ('EM Lyon Morocco / HEM', 'EMLYON-OBS-2026'),
    ('Université Mohammed V', 'UM5-OBS-2026'),
    ('UM6P', 'UM6P-OBS-2026'),
    ('ENCG Casablanca', 'ENCG-OBS-2026'),
    ('UIR', 'UIR-OBS-2026')
) as x(name, access_code)
where not exists (
  select 1 from public.universities u where u.name = x.name
);

with uni as (
  select id, name from public.universities
  where name in (
    'ESCA Ecole de Management',
    'EM Lyon Morocco / HEM',
    'Université Mohammed V',
    'UM6P',
    'ENCG Casablanca',
    'UIR'
  )
),
seed_rows as (
  select *
  from (
    values
      ('Yasmine Alaoui','ESCA Ecole de Management',2020,'Business Administration','employed','Business Analyst','OCP Group','Industry','12000-22000',2,'Casablanca, Morocco','https://www.linkedin.com/in/yasmine-alaoui-morocco'),
      ('Mehdi Bennis','ESCA Ecole de Management',2021,'Finance','employed','Financial Analyst','Attijariwafa Bank','Banking','12000-22000',4,'Rabat, Morocco','https://www.linkedin.com/in/mehdi-bennis-morocco'),
      ('Sara El Idrissi','ESCA Ecole de Management',2022,'Marketing','seeking',null,null,null,null,8,'Casablanca, Morocco','https://www.linkedin.com/in/sara-el-idrissi-morocco'),
      ('Karim Tazi','ESCA Ecole de Management',2023,'Economics','employed','Junior Consultant','Deloitte Maroc','Consulting','6000-12000',3,'Casablanca, Morocco','https://www.linkedin.com/in/karim-tazi-morocco'),
      ('Fatima Zahra Lahlou','ESCA Ecole de Management',2024,'Business Administration','further_study','MSc Student','HEC Paris','Education','6000-12000',null,'Paris, France','https://www.linkedin.com/in/fatima-zahra-lahlou-morocco'),
      ('Amine Cherkaoui','ESCA Ecole de Management',2021,'Finance','employed','Risk Analyst','BMCE Bank','Banking','12000-22000',5,'Casablanca, Morocco','https://www.linkedin.com/in/amine-cherkaoui-morocco'),
      ('Nour Eddine Rahali','ESCA Ecole de Management',2022,'Marketing','entrepreneurship','Co-founder','Souk Digital Studio','Startup','12000-22000',6,'Marrakech, Morocco','https://www.linkedin.com/in/nour-eddine-rahali-morocco'),
      ('Youssef Benjelloun','ESCA Ecole de Management',2020,'Economics','employed','Strategy Associate','McKinsey Casablanca','Consulting','22000-45000',2,'Casablanca, Morocco','https://www.linkedin.com/in/youssef-benjelloun-morocco'),
      ('Leila Berrada','ESCA Ecole de Management',2023,'Business Administration','employed','Account Manager','Wafasalaf','Finance','6000-12000',3,'Rabat, Morocco','https://www.linkedin.com/in/leila-berrada-morocco'),
      ('Omar Saidi','ESCA Ecole de Management',2024,'Finance','unknown',null,null,null,null,null,'Casablanca, Morocco','https://www.linkedin.com/in/omar-saidi-morocco'),
      ('Salma Mernissi','ESCA Ecole de Management',2021,'Marketing','employed','Brand Executive','Maroc Telecom','Telecom','12000-22000',4,'Casablanca, Morocco','https://www.linkedin.com/in/salma-mernissi-morocco'),
      ('Hamza Naciri','ESCA Ecole de Management',2022,'Economics','employed','Data Analyst','CDG','Public','12000-22000',6,'Rabat, Morocco','https://www.linkedin.com/in/hamza-naciri-morocco'),

      ('Imane Kabbaj','EM Lyon Morocco / HEM',2020,'Business Administration','employed','Audit Associate','PwC Maroc','Consulting','12000-22000',3,'Casablanca, Morocco','https://www.linkedin.com/in/imane-kabbaj-morocco'),
      ('Rachid El Fassi','EM Lyon Morocco / HEM',2021,'Finance','employed','Credit Analyst','CIH Bank','Banking','12000-22000',4,'Casablanca, Morocco','https://www.linkedin.com/in/rachid-el-fassi-morocco'),
      ('Meriem Ait Lahcen','EM Lyon Morocco / HEM',2022,'Marketing','seeking',null,null,null,null,9,'Rabat, Morocco','https://www.linkedin.com/in/meriem-ait-lahcen-morocco'),
      ('Anas Bouzidi','EM Lyon Morocco / HEM',2023,'Business Administration','employed','Consultant','EY Maroc','Consulting','6000-12000',2,'Casablanca, Morocco','https://www.linkedin.com/in/anas-bouzidi-morocco'),
      ('Hajar Tounsi','EM Lyon Morocco / HEM',2024,'Economics','further_study','MBA Student','IE Business School','Education','6000-12000',null,'Madrid, Spain','https://www.linkedin.com/in/hajar-tounsi-morocco'),
      ('Zakaria Chraibi','EM Lyon Morocco / HEM',2021,'Finance','employed','Treasury Analyst','Société Générale Maroc','Banking','12000-22000',5,'Casablanca, Morocco','https://www.linkedin.com/in/zakaria-chraibi-morocco'),
      ('Kenza Abkari','EM Lyon Morocco / HEM',2022,'Marketing','entrepreneurship','Founder','Atlas Growth Lab','Startup','12000-22000',6,'Tangier, Morocco','https://www.linkedin.com/in/kenza-abkari-morocco'),
      ('Bilal Hmimsa','EM Lyon Morocco / HEM',2023,'Business Administration','employed','Sales Operations Analyst','Microsoft Morocco','Technology','6000-12000',3,'Casablanca, Morocco','https://www.linkedin.com/in/bilal-hmimsa-morocco'),

      ('Yassine Aouad','Université Mohammed V',2020,'Law','employed','Legal Officer','Banque Populaire','Banking','12000-22000',6,'Rabat, Morocco','https://www.linkedin.com/in/yassine-aouad-morocco'),
      ('Siham El Mansouri','Université Mohammed V',2021,'Economics','employed','Economic Analyst','CDG','Public','12000-22000',5,'Rabat, Morocco','https://www.linkedin.com/in/siham-el-mansouri-morocco'),
      ('Adil Boulahya','Université Mohammed V',2022,'Computer Science','employed','Software Engineer','IBM Morocco','Technology','12000-22000',4,'Rabat, Morocco','https://www.linkedin.com/in/adil-boulahya-morocco'),
      ('Nadia Hakam','Université Mohammed V',2023,'Law','seeking',null,null,null,null,12,'Rabat, Morocco','https://www.linkedin.com/in/nadia-hakam-morocco'),
      ('Ayoub Bekkali','Université Mohammed V',2024,'Engineering','employed','Junior Engineer','Leoni','Manufacturing','6000-12000',3,'Kenitra, Morocco','https://www.linkedin.com/in/ayoub-bekkali-morocco'),
      ('Samira Belhaj','Université Mohammed V',2021,'Economics','employed','Business Controller','Royal Air Maroc','Aviation','12000-22000',6,'Casablanca, Morocco','https://www.linkedin.com/in/samira-belhaj-morocco'),
      ('Driss Ouhajji','Université Mohammed V',2022,'Computer Science','further_study','MSc AI Student','TU Munich','Education','12000-22000',null,'Munich, Germany','https://www.linkedin.com/in/driss-ouhajji-morocco'),
      ('Mouna Chafai','Université Mohammed V',2020,'Law','employed','Compliance Analyst','BCP Bank','Banking','12000-22000',3,'Rabat, Morocco','https://www.linkedin.com/in/mouna-chafai-morocco'),
      ('Ilyas Laghmari','Université Mohammed V',2023,'Engineering','employed','Quality Engineer','Renault Tanger','Automotive','6000-12000',4,'Tangier, Morocco','https://www.linkedin.com/in/ilyas-laghmari-morocco'),
      ('Chaimae Rami','Université Mohammed V',2024,'Economics','unknown',null,null,null,null,null,'Rabat, Morocco','https://www.linkedin.com/in/chaimae-rami-morocco'),

      ('Rim Benkirane','UM6P',2020,'Engineering','employed','Process Engineer','OCP Innovation','Industry','22000-45000',2,'Benguerir, Morocco','https://www.linkedin.com/in/rim-benkirane-morocco'),
      ('Walid Azzouzi','UM6P',2021,'Computer Science','employed','Data Scientist','Capgemini Morocco','Technology','12000-22000',3,'Casablanca, Morocco','https://www.linkedin.com/in/walid-azzouzi-morocco'),
      ('Asmae Ghami','UM6P',2022,'Engineering','employed','R&D Engineer','OCP Group','Industry','12000-22000',5,'Benguerir, Morocco','https://www.linkedin.com/in/asmae-ghami-morocco'),
      ('Soufiane El Khattabi','UM6P',2023,'Computer Science','seeking',null,null,null,null,7,'Casablanca, Morocco','https://www.linkedin.com/in/soufiane-el-khattabi-morocco'),
      ('Loubna Idrissi','UM6P',2024,'Engineering','further_study','MSc Energy Student','Imperial College London','Education','6000-12000',null,'London, UK','https://www.linkedin.com/in/loubna-idrissi-morocco'),
      ('Tariq El Omari','UM6P',2021,'Economics','employed','Investment Analyst','Attijariwafa Bank','Banking','12000-22000',4,'Casablanca, Morocco','https://www.linkedin.com/in/tariq-el-omari-morocco'),
      ('Nisrine Abid','UM6P',2022,'Computer Science','entrepreneurship','Founder','GreenTech Atlas','Startup','12000-22000',6,'Benguerir, Morocco','https://www.linkedin.com/in/nisrine-abid-morocco'),
      ('Brahim Kettani','UM6P',2023,'Engineering','employed','Project Engineer','Valeo','Automotive','6000-12000',3,'Kenitra, Morocco','https://www.linkedin.com/in/brahim-kettani-morocco'),

      ('Mina El Azhar','ENCG Casablanca',2020,'Business Administration','employed','Account Executive','Inwi','Telecom','12000-22000',2,'Casablanca, Morocco','https://www.linkedin.com/in/mina-el-azhar-morocco'),
      ('Younes Hariri','ENCG Casablanca',2021,'Finance','employed','Credit Risk Analyst','BMCE Bank','Banking','12000-22000',4,'Casablanca, Morocco','https://www.linkedin.com/in/younes-hariri-morocco'),
      ('Ikram Touil','ENCG Casablanca',2022,'Marketing','employed','Marketing Analyst','PwC Maroc','Consulting','12000-22000',5,'Casablanca, Morocco','https://www.linkedin.com/in/ikram-touil-morocco'),
      ('Reda El Ghazi','ENCG Casablanca',2023,'Economics','seeking',null,null,null,null,10,'Casablanca, Morocco','https://www.linkedin.com/in/reda-el-ghazi-morocco'),
      ('Hind Bouchaib','ENCG Casablanca',2024,'Business Administration','employed','Junior Auditor','KPMG Maroc','Consulting','6000-12000',3,'Casablanca, Morocco','https://www.linkedin.com/in/hind-bouchaib-morocco'),
      ('Jalil Bennani','ENCG Casablanca',2021,'Finance','employed','Sales Analyst','Wafasalaf','Finance','12000-22000',6,'Casablanca, Morocco','https://www.linkedin.com/in/jalil-bennani-morocco'),
      ('Nawal Fekkak','ENCG Casablanca',2022,'Marketing','further_study','MSc Marketing Student','ESCP','Education','12000-22000',null,'Paris, France','https://www.linkedin.com/in/nawal-fekkak-morocco'),

      ('Aya Lmrabet','UIR',2020,'Law','employed','Legal Counsel','Lydec','Utilities','12000-22000',3,'Casablanca, Morocco','https://www.linkedin.com/in/aya-lmrabet-morocco'),
      ('Marouane Ouali','UIR',2021,'Engineering','employed','Network Engineer','Maroc Telecom','Telecom','12000-22000',4,'Rabat, Morocco','https://www.linkedin.com/in/marouane-ouali-morocco'),
      ('Rania Boussaid','UIR',2022,'Computer Science','employed','Software Consultant','HPS','Technology','12000-22000',5,'Rabat, Morocco','https://www.linkedin.com/in/rania-boussaid-morocco'),
      ('Abdelilah Nouri','UIR',2023,'Engineering','entrepreneurship','Founder','SmartGrid Morocco','Startup','12000-22000',12,'Rabat, Morocco','https://www.linkedin.com/in/abdelilah-nouri-morocco'),
      ('Ghita Aabid','UIR',2024,'Computer Science','employed','Graduate Engineer','Capgemini Morocco','Technology','6000-12000',2,'Casablanca, Morocco','https://www.linkedin.com/in/ghita-aabid-morocco')
  ) as t(
    student_name, university_name, graduation_year, field_of_study, current_status,
    current_role, current_company, current_sector, current_salary_range,
    time_to_first_job_months, location, linkedin_url
  )
)
insert into public.graduate_profiles (
  university_id,
  student_name,
  graduation_year,
  field_of_study,
  current_status,
  current_role,
  current_company,
  current_sector,
  current_salary_range,
  time_to_first_job_months,
  location,
  linkedin_url,
  last_updated,
  created_at
)
select
  u.id,
  s.student_name,
  s.graduation_year,
  s.field_of_study,
  s.current_status,
  s.current_role,
  s.current_company,
  s.current_sector,
  s.current_salary_range,
  s.time_to_first_job_months,
  s.location,
  s.linkedin_url,
  now() - ((random() * 90)::int || ' days')::interval,
  now() - ((random() * 730)::int || ' days')::interval
from seed_rows s
join uni u on u.name = s.university_name
where not exists (
  select 1
  from public.graduate_profiles gp
  where gp.linkedin_url = s.linkedin_url
);

commit;

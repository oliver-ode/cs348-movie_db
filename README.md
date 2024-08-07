# cs348-movie_db

## Backend (Node + Express)
CD into "backend" : `cd backend`

Runs on port `4000`

Install packages: `npm install`

Start: `npm run start`

## Frontend (Typescript + React)
CD into "frontend" : `cd frontend`

Runs on port `3000`

Install packages: `npm install`

Start: `npm start`

## Database stuff

Create user (movieapp, pass1234)
```sql
CREATE USER 'movieapp'@'localhost' IDENTIFIED BY 'pass1234';
GRANT ALL PRIVILEGES ON *.* TO 'movieapp'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Import DB (have not tested): `mysql -u movieapp -p moviedb < moviedb.sql`

Export DB:  `mysqldump -u movieapp -p moviedb > moviedb.sql`

## Commands for Mac

To run the sql server: sudo /usr/local/mysql/bin/mysql -u root -p


## How to create database schema (Production Data)
`mysql -u movieapp -p --local-infile=1` 

Password is : pass1234 (as set up above)

```sql
SOURCE production_db/createdb.sql
```

## SQL Queries
Sql Queries can be found in : backend < queries

## Production Data Tests + Outputs
Production data tests/queries can be found in file called : production_db < test-production.sql

Production data outputs can be found in : production_db < production_outputs

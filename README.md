# cs348-movie_db

## Backend (Node + Express)

Runs on port `4000`

Install packages: `npm install`

Start: `npm run start`

## Frontend (Typescript + React)

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


## How to create database schema

`SELECT @@secure_file_priv;`

```sql
SOURCE createdb.sql
```
To run these queries, be sure to install mySQL on your machine.

After doing that, enter the following command ```mysql -u your_username -p``` to log into the mySQL command-line interface (Replace your_username with your mySQL username, by default use "root" to make the user the root user of the local computer).

Enter ```CREATE DATABASE movie_game;``` followed by ```USE movie_game;``` 
This will create a new db called movie_game and select it.

Now, exit the mySQL command-line interface, and run setup.sql via ```mysql -u your_username -p < setup.sql```.

You should now have the tables for the movie database available. Run the queries by either logging into the mySQL command-line interface again and copy-pasting them into the command line, or from the terminal directly by ```mysql -u your_username -p --database=movie_game -e "INSERT_QUERY_HERE;"```


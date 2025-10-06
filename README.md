
# Notein note file viewer

A simple frontend-backend app for viewing the notein proprietary file format. The python backend downloads and extrats the information from your note files from a onedrive backup.

The react frontend implements an algorithm to display the most common features from a note file. The frontend also includes a simple file explorer to display the note structure, as stored in your app.


## Run Locally

Clone the project

```bash
  git clone https://github.com/kisbAlt/notein_viewer.git
```

Go to the project directory

```bash
  cd notein_viewer
```

Change your rclone setup variables in OneDriveConnector.py

```bash
  cd backend
  # edit OneDriveConnector.py to match your config
```

Start the the backend server, install packages if needed

```bash
  python app.py
```

Install frontend dependencies

```bash
  cd frontend

  npm install
```

Start the frontend developement server

```bash
  npm run start
```


## Screenshots

![App Screenshot](documentation/screenshot1.png)
![App Screenshot](documentation/screenshot2.png)
![App Screenshot](documentation/screenshot3.png)


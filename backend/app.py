from typing import Annotated
import os.path
import fastapi
import secrets
from fastapi import FastAPI, Header
from starlette.responses import FileResponse, RedirectResponse, HTMLResponse, JSONResponse
from starlette.staticfiles import StaticFiles

from Note import Note
from OneDriveConnector import OneDriveConnector
from helper_functions import convert_color
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
app = FastAPI()

# TODO:
# at the layout loading, only load note from the newest folder/source

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/note_files", StaticFiles(directory="note_files"), name="note_files")
app.mount("/public-build", StaticFiles(directory="public-build", html=True), name="public-build")


@app.on_event("startup")
async def startup_event():
    with open("public-build/index.html", "r") as htm:
        app.indexhtml = htm.read()
    app.onedrive_connector = OneDriveConnector()
    app.tokens = get_tokens()


def get_tokens():
    if os.path.isfile("tokens.txt"):

        with open("tokens.txt", "r") as tokens:
            tkens = tokens.readlines()
    else:
        tken = secrets.token_hex(16)
        tkens = [tken]
        with open("tokens.txt", "w") as tokens:
            tokens.write(tken)
    return tkens


def auth(token):
    if token is None:
        return False
    elif "debug" in app.tokens:
        return True
    elif token in app.tokens:
        return True
    else:
        return False


@app.get("/")
async def root():
    return HTMLResponse(content=app.indexhtml, status_code=200)


@app.get("/note")
async def note():
    return HTMLResponse(content=app.indexhtml, status_code=200)


@app.get("/color")
async def color(code):
    # Handle negative values
    clr = convert_color(-12265546)
    return {"rgba": clr}


@app.get("/onedrive")
async def onedrive(token: Annotated[str | None, Header()] = None):
    if not auth(token): return JSONResponse({"message": "NotAuthorized"}, 401)
    return {"message": app.onedrive_connector.layout}


@app.get("/layout")
async def layout(token: Annotated[str | None, Header()] = None):
    if not auth(token): return JSONResponse({"message": "NotAuthorized"}, 401)
    print(token)
    return {"message": app.onedrive_connector.layout}


@app.get("/get_note")
async def get_note(nte_id):
    found_item = app.onedrive_connector.get_item(nte_id)
    if found_item is not False:
        note = Note(found_item['db_file'])
        json_data = note.get_json()
        json_data['data'] = found_item
        return {"message": json_data}
    return {"message": "not found"}


@app.get("/refresh")
async def refresh(token: Annotated[str | None, Header()] = None):
    if not auth(token): return JSONResponse({"message": "NotAuthorized"}, 401)
    app.onedrive_connector.load_data()
    return {"message": app.onedrive_connector.layout}


if __name__ == "__main__":
    uvicorn.run("app:app", port=9811, log_level="info")
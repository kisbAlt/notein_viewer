import fastapi
from fastapi import FastAPI
from starlette.responses import FileResponse, RedirectResponse
from starlette.staticfiles import StaticFiles

from Note import Note
from OneDriveConnector import OneDriveConnector
from helper_functions import convert_color
from fastapi.middleware.cors import CORSMiddleware
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
app.mount("/public-build", StaticFiles(directory="public-build"), name="public-build")

@app.on_event("startup")
async def startup_event():
    app.onedrive_connector = OneDriveConnector()


@app.get("/")
async def root():
    return RedirectResponse("public-build/index.html", status_code=fastapi.status.HTTP_200_OK)



@app.get("/color")
async def color(code):
    # Handle negative values
    clr = convert_color(-12265546)
    return {"rgba": clr}


@app.get("/test")
async def test():
    note = Note("note_database_note_e499a35c-52ba-4db5-9d16-d71212fb76e0_db")
    return {"message": note.get_json()}


@app.get("/onedrive")
async def onedrive():
    return {"message": app.onedrive_connector.layout}


@app.get("/layout")
async def layout():
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
async def refresh():
    app.onedrive_connector.load_data()
    return {"message": app.onedrive_connector.layout}

import json
from datetime import datetime

from rclone_python import rclone
import os
import shutil

RCLONE_REMOTE = "kisb_proton:"
STORE_FOLDER = "note_files"


class OneDriveConnector:
    def __init__(self):
        self.notein_folder = ""
        self.note_files = []
        self.extract_folders = []
        self.layout = []
        if not rclone.is_installed():
            print("RCLONE IS NOT INSTALLED, PLEASE INSTALL...")
            return
        for flder in rclone.ls(RCLONE_REMOTE + "/"):
            if (flder['Path'] == "NoteInOneDrive") and (flder['IsDir'] is True):
                print(flder)
                self.notein_folder = RCLONE_REMOTE + flder['Path']
        self.load_data()

    def load_data(self):
        self.note_files = []
        self.extract_folders = []
        self.layout = []
        self.list_files()
        self.force_sync()
        self.create_layout()
        self.sort_layout()

    def list_files(self):

        for fle in rclone.ls(self.notein_folder):
            self.note_files.append({
                "filename": fle['Path'],
                "name": fle['Name'],
                "size": fle['Size'],
                "myme_type": fle['MimeType'],
                "mod_time": fle['ModTime'],
                "is_dir": fle['IsDir'],
                "onedrive_id": fle['ID'],
            })

    def sync(self):
        if not os.path.isdir(STORE_FOLDER):
            self.force_sync()
        else:
            onlyfiles = [f for f in os.listdir(STORE_FOLDER) if os.path.isfile(os.path.join(STORE_FOLDER, f))]
            for drive_file in self.note_files:
                if drive_file['name'] not in onlyfiles:
                    print("downloading: ", drive_file['name'])
                    file_down = "/" + drive_file['name']
                    rclone.copy(self.notein_folder + file_down, STORE_FOLDER + file_down, ignore_existing=True)

    def force_sync(self):
        print("FORCE SYNCING")
        rclone.copy(self.notein_folder, STORE_FOLDER, ignore_existing=True, args=['--create-empty-src-dirs'],
                    show_progress=True)
        self.extract_files()

    def extract_files(self):
        onlyfiles = [f for f in os.listdir(STORE_FOLDER) if os.path.isfile(os.path.join(STORE_FOLDER, f))]
        for file in onlyfiles:
            folderpath = STORE_FOLDER + "/extracted/" + file
            filepath = STORE_FOLDER + "/" + file
            self.extract_folders.append(folderpath)
            if not os.path.isdir(folderpath):
                print("EXTRACTING: ", filepath)
                shutil.unpack_archive(filepath, extract_dir=folderpath, format="zip")

    def create_layout(self):
        date_updates = {}
        layout_index = 0
        for nte in self.extract_folders:
            element = {
                "folder": False,
                "creation_time": 0,
                "favorite": False,
                "id": "",
                "in_trash": False,
                "last_modification": 0,
                "last_opened": 0,
                "lock_added": False,
                "parent_id": "",
                "title": "",
                "tn_height": 0,
                "tn_path": "",
                "tn_width": 0,
                "total_pages": 0,
                "unbounded_note": False,
                "user_id": "",
                "using_own_pdf": False,
                "level": 0,
                "db_file": ""
            }
            meta_file = nte + "/note_meta.json"
            json_meta = {}
            item_files = [f for f in os.listdir(nte) if os.path.isfile(os.path.join(nte, f))]
            if os.path.isfile(meta_file):
                with open(meta_file, "r", encoding='utf-8') as meta:
                    json_meta = json.loads(meta.read())
                    element['last_opened'] = json_meta['lastOpenedTime']
                    element['lock_added'] = json_meta['lockAdded']
                    element['lock_added'] = json_meta['lockAdded']
                    element['tn_height'] = json_meta['tnHeight']
                    element['tn_height'] = json_meta['tnHeight']
                    element['tn_width'] = json_meta['tnWidth']
                    element['total_pages'] = json_meta['totalPagesCount']
                    element['unbounded_note'] = json_meta['unboundedNote']
                    element['using_own_pdf'] = json_meta['usingOwnPdf']
                    for file_item in item_files:
                        if "_db" in file_item and "-shm" not in file_item and "-wal" not in file_item:
                            element['db_file'] = nte + "/" + file_item
            else:
                found = False
                for fle in item_files:
                    try:
                        with open(nte + "/" + fle, "r", encoding='utf-8') as flder_file:
                            text_content = flder_file.read()
                            if "lastModificationTime" in text_content:
                                json_meta = json.loads(text_content)
                                element['folder'] = True
                                found = True
                                break
                    except UnicodeDecodeError:
                        pass
                if found is False:
                    continue
            if (len(json_meta.keys()) > 0) and ("title" in json_meta):
                if "parentId" in json_meta:
                    element['parent_id'] = json_meta['parentId']
                element['creation_time'] = json_meta['creationTime']
                if "favorite" in json_meta:
                    element['favorite'] = json_meta['favorite']
                element['id'] = json_meta['id']
                if "inTrashBin" in json_meta:
                    element['in_trash'] = json_meta['inTrashBin']
                element['last_modification'] = json_meta['lastModificationTime']

                element['title'] = json_meta['title']

                if "tnPath" in json_meta:
                    element['tn_path'] = json_meta['tnPath']
                if "userId" in json_meta:
                    element['user_id'] = json_meta['userId']

                if element['id'] in date_updates:
                    if date_updates[element['id']]['date'] >= element['last_modification']:
                        continue
                    else:
                        self.layout.pop(date_updates[element['id']]['index'])
                        layout_index = layout_index - 1

                date_updates[element['id']] = {'date': element['last_modification'], 'index': layout_index}
                self.layout.append(element)
                layout_index += 1

        for layout in self.layout:
            if layout['parent_id'] != "":
                level = 1
                curParent = self.get_item(layout['parent_id'])
                while (curParent is not False) and curParent['parent_id'] != "":
                    curParent = self.get_item(curParent['parent_id'])
                    level += 1
                layout['level'] = level

    def get_item(self, element_id):
        for item in self.layout:
            if item['id'] == element_id:
                return item
        return False

    def sort_layout(self):
        self.layout.sort(key=lambda x: (x['level'], x['title']))

        parent_dict = {}
        zero_level = []
        for item in self.layout:
            if item['parent_id'] != "":
                if item['parent_id'] not in parent_dict:
                    parent_dict[item['parent_id']] = []
                parent_dict[item['parent_id']].append(item)
            else:
                zero_level.append(item)
        sorted_list = []

        def add_children(parent_id):
            if parent_id in parent_dict:
                for child in parent_dict[parent_id]:
                    sorted_list.append(child)
                    add_children(child['id'])

        for it in zero_level:
            sorted_list.append(it)
            add_children(it['id'])

        self.layout = sorted_list

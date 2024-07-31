import json
import os
import sqlite3
from helper_functions import convert_color
import fitz


class Note:
    def __init__(self, db_file):
        self.strokes = []
        self.pages = []
        self.images = []
        self.pdf_images = []
        self.note_folder = db_file[0:db_file.rfind('/')]
        print("folder: ", self.note_folder)
        # Create a SQL connection to our SQLite database
        self.con = sqlite3.connect(db_file)
        self.cur = self.con.cursor()
        self.get_strokes()
        self.get_pages()
        self.get_images()
        self.get_shapes()
        # Be sure to close the connection
        self.con.close()
        self.process_pdf()

    def get_strokes(self):
        rows = []
        # The result of a "cursor.execute" can be iterated over by row
        tmp = self.cur.execute('SELECT * FROM StrokeEntity;')
        for row in tmp:
            stroke_json = json.loads(row[4])
            stroke_json['rgba'] = convert_color(stroke_json['color'])
            curStroke = {
                "id": row[0],
                "page_id": row[1],
                "layer_id": row[2],
                "creation_time": row[3],
                "json_stroke": stroke_json,
                "left": row[5],
                "top": row[6],
                "right": row[7],
                "bottom": row[8],
            }
            rows.append(curStroke)
        self.strokes = rows

    def get_pages(self):
        rows = []
        # The result of a "cursor.execute" can be iterated over by row

        for row in self.cur.execute('SELECT * FROM PageEntity;'):
            paper_theme = json.loads(row[4])
            if "baseTheme" in paper_theme:
                paper_theme['baseTheme']['argb'] = convert_color(paper_theme['baseTheme']['color'])
            curPage = {
                "id": row[0],
                "note_id": row[1],
                "paper_spec": json.loads(row[2]),
                "page_orientation": row[3],
                "paper_theme": paper_theme,
                "creation_time": row[5],
                "last_modification_time": row[6],
                "tn_path": row[7],
                "unbounded": row[8],
                "source": row[9],
            }
            rows.append(curPage)
        self.pages = rows

    def get_images(self):
        rows = []
        item_files = [f for f in os.listdir(self.note_folder) if os.path.isfile(os.path.join(self.note_folder, f))]
        for row in self.cur.execute('SELECT * FROM ImageEntity;'):
            curImage = {
                "id": row[0],
                "uri": row[1],
                "layer": row[2],
                "layer_id": row[3],
                "bounds": json.loads(row[4]),
                "rotation": row[5],
                "page_id": row[6],
                "creation_time": row[7],
                "last_modification_time": row[8],
                "left": row[9],
                "top": row[10],
                "right": row[11],
                "bottom": row[12],
                "fixed": row[13],
                "path": ""
            }
            for fle in item_files:
                if curImage['id'] in fle:
                    curImage['path'] = self.note_folder + "/" + fle
            rows.append(curImage)
        self.images = rows

    def get_shapes(self):
        rows = []
        # TYPES:
        # ID 7: line (2 points)
        # ID 7: line (2 points)
        # ID 3: quadrangle (4 points)
        # ID 6: round (4 points)
        # ID 0: 3-pint curve (3 points)
        # ID 19: dotted_line (2 points)
        # ID 20: wavy line (2 points)
        # ID 21: arrow (pointing to y coord) (2 points)
        # ID 22: 2-way arrow (2 points)
        # ID 24: curly brackets (2 points)
        # ID 23: 2d coordinate system (4 points)
        # ID 1: triangle (3 points)
        # ID 9: hexagon (6 points)
        # ID 8: ellipse (4 points)
        # ID 18: ? (4 points)
        # ID 10: heart (4 points)
        # ID 13: tringular box (4 points)
        # ID 12: pyramid box (4 points)
        # ID 14: cylinder (4 points)
        # ID 15: cone (4 points)
        # ID 16: ball (4 points)
        # ID 17: ball_cut (4 points)
        for row in self.cur.execute('SELECT * FROM ShapeEntity;'):
            curShape = {
                "id": row[0],
                "page_id": row[1],
                "color": row[2],
                "rgba": convert_color(row[2]),
                "width": row[3],
                "points": json.loads(row[4]),
                "type": row[5],
                "blend_mode": row[6],
                "layer_id": row[7],
                "tape_like": row[8],
                "style": row[9],
                "opacity_of_fill_color": row[10],
                "creation_time": row[11],
                "left": row[12],
                "top": row[13],
                "right": row[14],
                "bottom": row[15],
            }
            rows.append(curShape)
        self.shapes = rows

    def process_pdf(self):
        item_files = [f for f in os.listdir(self.note_folder) if os.path.isfile(os.path.join(self.note_folder, f))]
        for file in item_files:
            if ".pdf" in file:
                pdf_id = file.split("_")[-1].replace(".pdf", "")
                file_path = self.note_folder + "/" + file
                doc = fitz.open(file_path)  # open document

                for i, page in enumerate(doc):
                    png_file = file_path.replace(".pdf", f"_PAGE_{i}.png")
                    self.pdf_images.append({"filename": png_file, "page": i, "pdf": pdf_id})
                    if png_file.split("/")[-1] not in item_files:
                        pix = page.get_pixmap(dpi=500)  # render page to an image
                        pix.save(png_file)

        return

    def get_json(self):
        return {"strokes": self.strokes, "images": self.images, "pages": self.pages, "shapes": self.shapes,
                "pdf_images": self.pdf_images}

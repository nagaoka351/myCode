import PySimpleGUI as sg
from random import randint
import copy
import sys
import os

#----------------------------------------#----------------------------------------image_setting
class Class_image_setting:
    def __init__(self):
        self.img_icon = self.or_exist(r".\img\bomb.ico")
        self.img_bomb = self.or_exist(r".\img\bakudan.png")
    
    #or_exist
    def or_exist(self, file_path):
        if not os.path.exists(file_path):
            file_path = ""
        return file_path

#----------------------------------------#----------------------------------------board
class Class_board_setting:
    def __init__(self, max_rows, max_cols, bomb_num, board):
        self.max_rows = max_rows
        self.max_cols = max_cols
        self.bomb_num = bomb_num
        self.board = board
        self.bomb_place = []

    #make_bury_list
    def make_bury_list(self):
        bomb_place = []
        while(len(bomb_place) < self.bomb_num):
            rand = [randint(0, self.max_rows - 1), randint(0, self.max_cols - 1)]
            if not rand in bomb_place:
                bomb_place.append(rand)
        self.bomb_place = bomb_place

    #bury_bomb
    def bury_bomb(self):
        for e in self.bomb_place:
            x = e[0]
            y = e[1]
            self.board[y][x] += 8
            def xy(row, col):
                if 0 <= row < self.max_rows and 0 <= col < self.max_cols:
                    self.board[col][row] += 1
            [xy(x+i, y+j) for i in range(-1, 2) for j in range(-1, 2)]


#----------------------------------------#----------------------------------------place_label
# 動的な変数を扱うクラス
class Class_place_label:
    def __init__(self, max_rows, max_cols, bomb_num, board2):
        self.place_label = board2   #未/済/旗の判定に使う   {0:未, 1:済, 2:旗}
        self.clear_count = max_rows * max_cols - bomb_num
        self.is_clear = False
    
#----------------------------------------get_click_label
    #未/済/旗の判定に使う   {0:未, 1:済, 2:旗}
    def get_click_label(self, row, col, brd, event_name = "left_click"):
        click_label = self.place_label[col][row]
        click_value = brd.board[col][row]
        if (event_name == "left_click"):
            if (click_label == 0):
                self.place_label[col][row] = 1
                if (click_value < 9):   #bombは無視
                    self.clear_count -= 1
                if (self.clear_count <= 0): #クリア判定
                    self.is_clear = True
        elif (event_name == "right_click"):
            if (click_label == 0):
                self.place_label[col][row] = 2
            elif (click_label == 2):
                self.place_label[col][row] = 0
        return click_label


#----------------------------------------#----------------------------------------window_update
# font_color, board_update, board_open
# windowのupdate処理をするための関数群      引数がスパゲッティ状態
class Class_window_update:
#----------------------------------------font_color
    #get_font_color
    def get_font_color(self, click_value):
        color_dict = {0:"gray",1:"blue",2:"green",3:"red",4:"navy",5:"brown",6:"teal",7:"black",8:"purple"}
        if click_value < 9:
            return color_dict[click_value]
        else:
            return "white"
    
    #get_bg_color    bomb用
    def get_bg_color(self, is_clear):
        if is_clear == False:
            return "yellow"
        else:
            return ""

#----------------------------------------board_update
    #clickしたときのボタンupdate
    def board_update(self, img, window, row, col, brd, is_clear):
        click_value = brd.board[col][row]
        color = self.get_font_color(click_value)
        bg_color = self.get_bg_color(is_clear)
        if (click_value < 9):
            window[(row, col)].update(click_value, button_color=(color, "gray"),
                                        disabled=True, disabled_button_color=(color, "gray"))
        else:
            if os.path.exists(img.img_bomb):
                window[(row, col)].update(image_filename=img.img_bomb,
                                        image_size=(49, 49), button_color=(color, bg_color))
            else:
                window[(row, col)].update("bomb", button_color=("red", bg_color))
    
    #right_click用
    def board_update_right(self, img, window, event, click_label):
        if click_label == 0:
            window[event].update("!", button_color=("black","orangered"))
        elif click_label == 2:
            window[event].update("?", button_color=("white","#2B3B58"))

#----------------------------------------board_open
    #連鎖反応
    def chain_open(self, img, window, row, col, brd, place_label):
        if (0 <= row < brd.max_rows) and (0 <= col < brd.max_cols):
            click_label = place_label.get_click_label(row, col, brd)
            click_value = brd.board[col][row]
            if click_label in {1, 2}:
                return
            self.board_update(img, window, row, col, brd, place_label)
            if (click_value == 0):
                [self.chain_open(img, window, row + i, col + j, brd, place_label)
                    for i in range(-1, 2) for j in range(-1, 2)]
    
    #終了処理
    def at_end_open(self, img, window, brd, event, ending, is_clear):
        if (ending == "Game Over"):
            for xy in brd.bomb_place:
                if event == (xy[0], xy[1]):
                    continue
                self.board_update(img, window, xy[0], xy[1], brd, is_clear)
        elif (ending == "Game Clear"):
            for xy in brd.bomb_place:
                self.board_update(img, window, xy[0], xy[1], brd, is_clear)


#----------------------------------------#----------------------------------------make_game_window
def make_game_window(img, brd):
    #sg.Button(default, button_size, key, button_space)
    layout = [[sg.Menu([["&File",["Restart", "---", "Setting","---", "Exit"]]], font=("", 12))],
            [[sg.Button("?", size=(5, 2), key=(i, j), pad=(0,0), font=("メイリオ", 10, "bold"))
                for i in range(brd.max_rows)] for j in range(brd.max_cols)]]
    
    #windowの生成
    window = sg.Window("BombSweeper", layout, finalize=True, icon=img.img_icon)   #title
    #色の設定
    def bc(i, j):
        return window[(i, j)].update(button_color=("white","#2B3B58"))
    #right_click判定用
    def rc(i, j):
        return window[(i, j)].bind("<Button-3>", "right_click")
    [(bc(i, j), rc(i, j)) for i in range(brd.max_rows) for j in range(brd.max_cols)]
    return window


#----------------------------------------#----------------------------------------game_play
# window.read() → event判定(Exit, Restart, Setting, continue判定) → 
#  → right_click時の処理(フラグ管理, board更新) → 
#  → left_click時の処理(フラグ管理, board更新, Game Over判定, Game Clear判定)
def game_play(img, win_up, window, brd, place_label):  #window,board が散らばっててみづらい
    while True:
        event, values = window.read()
        
        #Exit
        if event in (sg.WIN_CLOSED, "Exit"):
            sys.exit()
        
        #Restart
        elif (event == "Restart"):
            break
        
        #Setting
        elif (event == "Setting"):
            is_input, values2 = setting_window(img, brd)
            if is_input == True:
                window.close()
                return values2["height"],values2["width"],values2["bombs"]
            continue
        
        #クリア状態ならcontinue
        elif place_label.is_clear == True:
            continue
        
        #right_click,  event => ((0, 1), "right_click")
        elif "right_click" in event:
            click_label = place_label.get_click_label(event[0][0], event[0][1], brd, event[1])
            win_up.board_update_right(img, window, event[0], click_label)
            continue        
        
        #left_click
        click_label = place_label.get_click_label(event[0], event[1], brd)
        if (click_label == 0):          #board_open
            click_value = brd.board[event[1]][event[0]]
            win_up.board_update(img, window, event[0], event[1], brd, place_label.is_clear)
            if (click_value == 0):      #連鎖反応
                [win_up.chain_open(img, window, event[0] + i, event[1] + j, brd, place_label)
                    for i in range(-1, 2) for j in range(-1, 2)]
            if (click_value > 8):       #Game Over
                place_label.is_clear = True
                win_up.at_end_open(img, window, brd, event, "Game Over", place_label.is_clear)
                sg.popup("Game Over", font=("", 16), grab_anywhere=True, icon=img.img_icon)
                break
            if (place_label.is_clear == True):  #クリア判定
                win_up.at_end_open(img, window, brd, event, "Game Clear", place_label.is_clear)
                sg.popup("Game Clear", font=("", 16), grab_anywhere=True, icon=img.img_icon)
        
    window.close()
    return brd.max_rows, brd.max_cols, brd.bomb_num


#----------------------------------------#----------------------------------------setting_window
# ゲーム設定のwindow
def setting_window(img, brd):
#----------------------------------------window
    def lam(n): return list(map(lambda i:i, range(1, n+1)))
    lay2_font = ("メイリオ", 12, "bold")
    layout_2 = [[sg.Text("　　高さ　(1～  16)", font=lay2_font),
        sg.Combo(default_value=brd.max_rows, values=lam(16), size=(5, 5), key="height", font=lay2_font)],
        [sg.Text("　　　幅　(1～  16)", font=lay2_font),
        sg.Combo(default_value=brd.max_cols, values=lam(16), size=(5, 5), key="width", font=lay2_font)],
        [sg.Text(f"爆弾の数　(1～{16**2})",  font=lay2_font, key="bombs_text"),
        sg.Combo(default_value=brd.bomb_num, values=lam(16**2), size=(5, 5), key="bombs", font=lay2_font)],
        [sg.Push(), sg.Button("  OK  ", key="OK", font=lay2_font),
            sg.Button("Cancel", key="Cancel", font=lay2_font), sg.Push()],
        ]

#----------------------------------------is_error
    def is_error(values2):
        hei, wid, bom = values2["height"], values2["width"], values2["bombs"]
        if (int_less_than_m(hei, 16) and int_less_than_m(wid, 16) and
                int_less_than_m(bom, 16**2) and hei * wid > bom):
            return False
        else:
            return True
    
    #intで,0 < n <= mなら true
    def int_less_than_m(n, m):  
        if isinstance(n, int) and (0 < n <= m):
            return True
        return False

#----------------------------------------while
    is_input = False
    window2 = sg.Window("Setting", layout_2, finalize=True, icon=img.img_icon)   #title
    while True:
        event2, values2 = window2.read()
        if event2 in {sg.WIN_CLOSED, "Cancel"}:
            break
        if event2 == "OK":
            if (is_error(values2) == False):
                is_input = True
                break
            else:
                sg.popup("Input Error.", font=("", 16), grab_anywhere=True)
    window2.close()
    return is_input, values2


#----------------------------------------#----------------------------------------main
# 初期設定(幅、高さ、数、画像, update関数群) → Class_board_setting生成(固定値用のクラス) →
#  → 爆弾を埋める → Class_place_label生成(動的な変数を扱うクラス) → 
#  → window生成 → play
def main():
    max_rows = max_cols = 6
    bomb_num = 5
    img = Class_image_setting()
    win_up = Class_window_update()
    while True:
        board = [[int(0) for i in range(max_rows)] for j in range(max_cols)]
        board2 = copy.deepcopy(board)
        brd = Class_board_setting(max_rows, max_cols, bomb_num, board)
        brd.make_bury_list()
        brd.bury_bomb()
        place_label = Class_place_label(max_rows, max_cols, bomb_num, board2)
        window = make_game_window(img, brd)
#        import pandas; df = pandas.DataFrame(brd.board); print("\n",df); #デバッグ用
        max_rows, max_cols, bomb_num = game_play(img, win_up, window, brd, place_label)

#----------------------------------------#----------------------------------------
if __name__ == "__main__": main()
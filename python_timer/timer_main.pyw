#flowchart
#distinguish name( input, keymap, select ) --> self_exec --> sleep --> popup
#script_path = args[0], script_name = args[1], sleep_time = args[2]
import PySimpleGUI as sg
import datetime
import time
import re
import os
import sys
import subprocess
import codecs

def main():
    #設定 みづらい
    editor = fr"C:\Users\{os.getlogin()}\AppData\Local\Programs\Microsoft VS Code\Code.exe"
    if not os.path.exists(editor):
        editor = "notepad"
    img_alert = r"time_is_coming.png" #alert用の画像
    if not os.path.exists(img_alert):
        img_alert = ""
    is_alert = True     #true: alert window, false: popup tray
        
    if len(sys.argv) > 1:
        script_name = sys.argv[1]
    else:
        script_name = os.path.basename(sys.argv[0])
    script_path = sys.argv[0]
    open_editor = editor + " " + script_path
    os.system("title " + script_name)
    sg.theme('Dark Teal 11')
    msg_01 = "数値を入力して下さい\n(例, 1=1秒, 1m=1分, 1h=1時間)"

#----------------------------------------
    #名前の一部を引数にして、動作を分けている
    if len(sys.argv) > 2:
        print(sys.argv[0]+"\n", sys.argv[1]+"\n", sys.argv[2])
        sleep_time = sys.argv[2]
        sleep_main(sleep_time, img_alert, is_alert)
    else:
        if re.search("menu", script_name):
            sleep_time = layout_select_menu(msg_01, open_editor)
            another_run(script_path, sleep_time)
        elif re.search("keymap", script_name):
            sleep_time = layout_select_keypad(msg_01, open_editor)
            another_run(script_path, sleep_time)
        elif re.search("input", script_name):
            sleep_time = layout_input(msg_01, open_editor)
            another_run(script_path, sleep_time)
        else:
            make_subfile()
#            layout_combo(msg_01, open_editor)


#----------------------------------------#----------------------------------------another_run
def another_run(script_path, sleep_time):   #非表示から最小化に切り替える関数
    title = "timer_"+str(sleep_time)+"_"+str(time.localtime().tm_hour)+"h"+str(time.localtime().tm_min)+"m"

    SW_MINIMIZE = 6
    info = subprocess.STARTUPINFO()
    info.dwFlags = subprocess.STARTF_USESHOWWINDOW
    info.wShowWindow = SW_MINIMIZE
    subprocess.Popen(r"python.exe " + str(script_path) + " " + title + " " + str(sleep_time), startupinfo=info)

#----------------------------------------#----------------------------------------messagebox
def layout_input(msg_01, open_editor):       #input
    output_frame = [[sg.Text(msg_01, key="-msg-")],
                [sg.InputText(key="-input-")],
                [sg.Submit(button_text='Ok'), sg.Submit(button_text='Cancel'),
                sg.T(' ' *18), sg.Submit(button_text='c_keypad'), sg.Submit(button_text='c_menu')]
                ]
    layout = output_frame

    window = sg.Window(title='timer', layout=layout, no_titlebar=False, grab_anywhere=True)
    event, values = window.read()
    window.close()
    if event is None:
        sys.exit()
    elif event == 'c_keypad':
        return layout_select_keypad(msg_01, open_editor)
    elif event == 'c_menu':
        return layout_select_menu(msg_01, open_editor)
    else:
        if len(values['-input-']) > 0:
            return values['-input-']
        else:
            sys.exit()

#----------------------------------------
def layout_select_keypad(msg_01, open_editor):   #keypad
    output_frame = [[sg.Text(msg_01)],
#                [sg.Input(size=(25, 1), font=('Helvetica', 10), justification='right', key='-input-')],
                [sg.Frame('Input',  layout=[[sg.Text(size=(10, 1), font=('Helvetica', 20), key='-input-')]])],
#                [sg.Text(font=('Helvetica', 20), key='-input-')],
                [sg.Frame('Keypad', layout=[           
                [sg.Button('1'), sg.Button('2'), sg.Button('3')],
                [sg.Button('4'), sg.Button('5'), sg.Button('6')],
                [sg.Button('7'), sg.Button('8'), sg.Button('9')],
                [sg.Button('0'), sg.Button('.'), sg.Button('Back')],
                [sg.Button('m'), sg.Button('h'),sg.Button('Clear')],
                [sg.Button('Submit'), sg.Button('Change_mode'), sg.Button('Setting')]
                ])]]
    layout = output_frame
    window = sg.Window(title='timer', layout=layout, default_button_element_size=(5,2), auto_size_buttons=False)
    keys_entered = ''
    while True:
        event, values = window.read()
        if event == sg.WIN_CLOSED:  # if the X button clicked, just exit
            sys.exit()
        if event == 'Clear':  # clear keys if clear button
            keys_entered = ''
        elif event in r'1234567890mh.':
            keys_entered += event  # add the new digit
        elif event == 'Back':
            keys_entered = keys_entered[0:len(keys_entered)-1]  # sub digit
        elif event == 'Setting':
            subprocess.Popen(open_editor)
            sys.exit()
        elif event == 'Submit' or event == 'Change_mode':
            break
        window['-input-'].update(keys_entered)  # change the window to reflect current key string
    window.close()
    if event == 'Change_mode':
        keys_entered = layout_select_menu(msg_01, open_editor)
    elif keys_entered == '':
            sys.exit()
    return keys_entered

#----------------------------------------
def layout_select_menu(msg_01, open_editor):     #menu
    menu_list = ["5m","10m","15m","30m", "50m", "1h", "2h", "3h", "4h", "5h", "6h","8h","12h","14h","16h","20h","24h",
                "Change_mode", "Setting"]
#    output_frame = [[sg.Text(msg_01)]]      #普通のやつ
#    for e in menu_list:
#        output_frame.append([sg.Push(), sg.Button(e), sg.Push()])
#    output_frame = [[sg.Text(msg_01)],
#                [[sg.Push(), sg.Button(i), sg.Push()] for i in menu_list]   #list内包表記
#                ]
    def lam(e): return sg.Push(), sg.Button(e), sg.Push()
    output_frame = [[sg.Text(msg_01)], list(map(lam, menu_list))]   #map
#                    list(map(lambda x : (sg.Push(), sg.Button(e), sg.Push()), menu_list))   #lambda 無名関数

    layout = output_frame
    window = sg.Window(title='timer', layout=layout, default_button_element_size=(20,1), auto_size_buttons=False)
    event, values = window.read()
    window.close()
    if event == sg.WIN_CLOSED:
        sys.exit()
    elif event == 'Change_mode' or event == 'c_keypad':
        event = layout_select_keypad(msg_01, open_editor)
    elif event == 'c_input':
        event = layout_input(msg_01, open_editor)
    elif event == 'Setting':
        subprocess.Popen(open_editor)
        sys.exit()
    return event

#----------------------------------------
def layout_combo(msg_01, open_editor):
    output_frame =  [sg.Frame('Keypad', layout=[
        [sg.Text(msg_01)]])],[
        [sg.InputCombo(('Combobox 1', 'Combobox 2'), size=(25, 5), key='combo')],
        [sg.Push(), sg.Button("i"), sg.Push()]
    ]
    layout = [output_frame]
    window = sg.Window(title='timer', layout=layout, default_button_element_size=(5,1), auto_size_buttons=False)
    event, values = window.read()
    window.close()
    sys.exit()

#----------------------------------------
def layout_popup(title_args, message_args, img_alert, is_alert):
    if is_alert:
        #alert window
        sg.popup(message_args, keep_on_top = True, image = img_alert, grab_anywhere = True)
    else:
        #popup tray
        tray = sg.SystemTray(menu= None)
        tray.ShowMessage(title=title_args, message=message_args, messageicon=sg.DEFAULT_BASE64_ICON, time=(1000, 1000 * 20))
        tray.close()


#----------------------------------------#----------------------------------------sleep
def sleep_main(sleep_time, img_alert, is_alert):
    try:
        clock_time, clock_seconds, symbol = adapt_sleeptime(sleep_time) 
    except:
        sg.popup("Input Error\n\nmとhは併用できません\nx, 1h30m\no, 1.5h\no, 90m", keep_on_top = True, grab_anywhere = True)
        
    if isinstance(clock_seconds, float):    #データ型の比較
        dt = datetime.datetime.now() + datetime.timedelta(seconds=clock_seconds)
        def slice19(e): return str(e)[:19]
        print(slice19(datetime.datetime.now()))
        print(slice19(dt))
    
        while (datetime.datetime.now() < dt): #time.sleep単体ではズレることがあったので、現在時刻との比較
            time.sleep(1)

        msg_end = "経過時間\n" + str(clock_time) + symbol
        layout_popup(sleep_time, msg_end, img_alert, is_alert)
    else:
        sg.popup("Input Error", keep_on_top = True, grab_anywhere = True)

#----------------------------------------
#引数(sleep_time)から一致するsignを探す → 対応リストに基づき、秒数に直す
def adapt_sleeptime(sleep_time):
    sleeptime_dict = [{"sign":"h", "seconds":3600, "symbol":"時間"},
                    {"sign":"m", "seconds":60, "symbol":"分"},
                    {"sign":"s", "seconds":1, "symbol":"秒"}]

    for d in sleeptime_dict:
        sign = d["sign"]
        if re.search(sign, sleep_time):
            break   #forのブロックがないみたいなので値代入とかせず、break

    seconds, symbol = d["seconds"], d["symbol"]
    clock_time = re.sub(sign, "", sleep_time)
    clock_seconds = float(clock_time) * seconds
    return  clock_time, clock_seconds, symbol


#----------------------------------------#----------------------------------------maku_sub
def make_subfile():	#書き換え
    list_subscript = ["timer_input.pyw", "timer_menu.pyw", "timer_keymap.pyw"]
    def lam(e): return r"./" + e
    dirlist_subscript = list(map(lam, list_subscript))
    for e in dirlist_subscript:
        with codecs.open(e, "w", "utf8") as f_id:
            f_id.write(subfile_all_str())

def subfile_all_str() -> str:  #長いので切り分け  ->はアノテーション
    return """\
import os, sys, subprocess
script_directory_main = r"timer_main.pyw"
script_name_this = os.path.basename(sys.argv[0])
subprocess.run(f"pythonw.exe {script_directory_main} {script_name_this}")
"""

#----------------------------------------#----------------------------------------
if __name__ == "__main__":    main()

import telebot
from telebot import types
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import tempfile
import os
import re
import random
import json
import html
import base64
from acrcloud.recognizer import ACRCloudRecognizer
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

token = "8608802005:AAG9ain_8ufELQgcbjyMspcg_cbh539z6l4"
channel_username = "@DevX_S1"

bot = telebot.TeleBot(token)

acr_config = {
    'host': 'identify-eu-west-1.acrcloud.com',
    'access_key': '9e57b4242550cf75c233b78b403d57de',
    'access_secret': 'glASDF81N346ClWxEZpT0yUeykY8R8PnXhKaHsY5',
    'timeout': 10
}

acr = ACRCloudRecognizer(acr_config)

AES_KEY = bytes.fromhex("C5D58EF67A7584E4A29F6C35BBC4EB12")

SAVETUBE_HEADERS = {
    "content-type": "application/json",
    "origin": "https://yt.savetube.me",
    "user-agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36"
}

YOUTUBE_CONVERT_HEADERS = {
    "accept": "application/json",
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0 (Android)",
    "referer": "https://ytmp3.gg/"
}

SPOTIFY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Priority": "u=1, i",
    "Referer": "https://spotdl.io/",
    "Origin": "https://spotdl.io"
}

# ============================================
# دوال مساعدة مشتركة
# ============================================

def check_sub(user_id):
    """التحقق من الاشتراك في القناة"""
    try:
        chat_member = bot.get_chat_member(channel_username, user_id)
        return chat_member.status in ['member', 'administrator', 'creator']
    except Exception:
        return False


def force_sub_markup():
    """إنشاء زر الاشتراك الإجباري"""
    markup = types.InlineKeyboardMarkup()
    btn = types.InlineKeyboardButton(
        "إضغط هنا للاشتراك ✅",
        url=f"https://t.me/{channel_username.replace('@', '')}"
    )
    markup.add(btn)
    return markup


def require_subscription(message):
    """التحقق من الاشتراك وإرسال رسالة إذا لم يكن مشترك"""
    if not check_sub(message.from_user.id):
        bot.send_message(
            message.chat.id,
            f"⚠️ عذراً، يجب الاشتراك في القناة أولاً\n\nالقناة: {channel_username}",
            reply_markup=force_sub_markup()
        )
        return False
    return True


def format_bytes(size):
    """تحويل البايتس إلى صيغة مقروءة"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} PB"


def extract_video_id(url):
    """استخراج معرف الفيديو من رابط يوتيوب"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
        r'(?:v=|\/)([a-zA-Z0-9_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


# ============================================
# دوال التحميل من المنصات المختلفة
# ============================================

def decrypt_savetube_data(encrypted_data):
    """فك تشفير بيانات Savetube"""
    try:
        encrypted = base64.b64decode(encrypted_data)
        iv = encrypted[:16]
        cipher = AES.new(AES_KEY, AES.MODE_CBC, iv)
        decrypted = unpad(cipher.decrypt(encrypted[16:]), AES.block_size)
        return json.loads(decrypted.decode())
    except Exception as e:
        raise Exception(f"فشل فك التشفير: {str(e)}")


def download_from_savetube(video_id, download_type="audio", quality="128"):
    """تحميل من Savetube API"""
    session = requests.Session()
    session.headers.update(SAVETUBE_HEADERS)

    # Get CDN
    cdn_res = session.get("https://media.savetube.vip/api/random-cdn").json()
    cdn = cdn_res.get("cdn")
    if not cdn:
        raise Exception("فشل في الحصول على CDN")

    # Get info
    info_res = session.post(
        f"https://{cdn}/v2/info",
        json={"url": f"https://www.youtube.com/watch?v={video_id}"}
    ).json()

    if "data" not in info_res:
        raise Exception("فشل في الحصول على معلومات الفيديو")

    # Decrypt
    meta = decrypt_savetube_data(info_res["data"])

    # Download
    dl_res = session.post(
        f"https://{cdn}/download",
        json={
            "id": video_id,
            "downloadType": download_type,
            "quality": quality,
            "key": meta.get("key", "")
        }
    ).json()

    download_url = dl_res.get("data", {}).get("downloadUrl")
    if not download_url:
        raise Exception("فشل في الحصول على رابط التحميل")

    return {
        "download_url": download_url,
        "thumbnail": meta.get("thumbnail", f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"),
        "meta": meta
    }


def search_youtube(query):
    """البحث في يوتيوب - API محدث"""
    try:
        # API أول: piped
        try:
            apis = [
                "https://pipedapi.moomoo.me",
                "https://pipedapi.adminforge.de",
                "https://api.piped.projectsegfault.com"
            ]

            for api_base in apis:
                try:
                    search_url = f"{api_base}/search"
                    params = {
                        "q": query,
                        "filter": "videos"
                    }

                    response = requests.get(search_url, params=params, timeout=10)
                    data = response.json()

                    if data and len(data.get("items", [])) > 0:
                        video = data["items"][0]
                        return {
                            "video_id": video.get("url", "").replace("/watch?v=", ""),
                            "title": video.get("title", "Unknown"),
                            "channel": video.get("uploaderName", "Unknown")
                        }
                except:
                    continue
        except:
            pass

        # API ثاني: invidious
        try:
            invidious_apis = [
                "https://vid.puffyan.us",
                "https://y.com.sb",
                "https://invidious.snopyta.org"
            ]

            for api_base in invidious_apis:
                try:
                    search_url = f"{api_base}/api/v1/search"
                    params = {"q": query, "type": "video"}

                    response = requests.get(search_url, params=params, timeout=10)
                    data = response.json()

                    if data and len(data) > 0:
                        video = data[0]
                        return {
                            "video_id": video.get("videoId", ""),
                            "title": video.get("title", "Unknown"),
                            "channel": video.get("author", "Unknown")
                        }
                except:
                    continue
        except:
            pass

        return None

    except Exception as e:
        raise Exception(f"فشل البحث: {str(e)}")


def convert_youtube(url, mode="video"):
    """تحويل رابط يوتيوب"""
    try:
        meta = requests.get(
            "https://www.youtube.com/oembed",
            params={"url": url, "format": "json"},
            timeout=10
        ).json()

        output = {
            "type": "video" if mode == "video" else "audio",
            "format": "mp4" if mode == "video" else "mp3",
            "quality": "360p" if mode == "video" else None
        }
        if output["quality"]:
            output = {k: v for k, v in output.items() if v is not None}

        payload = {
            "url": url,
            "os": "android",
            "output": output
        }

        for api in ["https://hub.ytconvert.org/api/download", "https://api.ytconvert.org/api/download"]:
            try:
                r = requests.post(api, json=payload, headers=YOUTUBE_CONVERT_HEADERS, timeout=30)
                data = r.json()
                status_url = data.get("statusUrl")

                if status_url:
                    break
            except:
                continue
        else:
            return None

        # Poll for status
        for _ in range(30):  # Max 30 attempts
            res = requests.get(status_url, headers=YOUTUBE_CONVERT_HEADERS, timeout=10).json()

            if res.get("status") == "completed":
                return {
                    "title": meta.get("title", "Unknown"),
                    "author": meta.get("author_name", "Unknown"),
                    "url": res.get("downloadUrl")
                }

            if res.get("status") == "failed":
                return None

            import time
            time.sleep(2)

        return None
    except Exception as e:
        print(f"Error in convert_youtube: {e}")
        return None


def download_tiktok_video(url):
    """تحميل من TikTok"""
    api = "https://www.tikwm.com/api/"
    res = requests.post(api, data={"url": url}, timeout=30)
    data = res.json()

    if data.get("data"):
        return {
            "video_url": data["data"]["play"],
            "title": data["data"].get("title", "بدون عنوان"),
            "cover": data["data"].get("cover", "")
        }
    return None


def download_instagram_video(url):
    """تحميل من Instagram"""
    api = f"https://snapdownloader.com/tools/instagram-downloader/download?url={url}"
    headers = {"User-Agent": "Mozilla/5.0"}

    r = requests.get(api, headers=headers, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")

    download_btn = soup.find("a", class_="btn-download")
    if download_btn:
        return download_btn.get("href")
    return None


def download_facebook_video(url):
    """تحميل من Facebook باستخدام API"""
    try:
        api = f"https://terbo-api.vercel.app/api/facebook?url={url}"
        res = requests.get(api, timeout=30).json()

        if not res.get("status"):
            return None

        data = res.get("result", {})

        video_url = data.get("video")
        title = html.unescape(data.get("title", "Facebook Video"))

        if not video_url:
            return None

        return {
            "url": video_url,
            "title": title
        }

    except Exception as e:
        print("Facebook API Error:", e)
        return None


def download_pinterest_media(url):
    """تحميل من Pinterest"""
    session = requests.Session()

    r = session.get("https://snappin.app/", timeout=10)
    soup = BeautifulSoup(r.text, "html.parser")

    csrf = soup.find("meta", {"name": "csrf-token"})
    if not csrf:
        return None, None

    headers = {
        "x-csrf-token": csrf["content"],
        "content-type": "application/json",
        "origin": "https://snappin.app",
        "referer": "https://snappin.app/",
        "user-agent": "Mozilla/5.0"
    }

    res = session.post("https://snappin.app/", json={"url": url}, headers=headers, timeout=30)
    soup = BeautifulSoup(res.text, "html.parser")

    links = soup.find_all("a", class_="button is-success")

    video_url = None
    image_url = None

    for a in links:
        link = a.get("href", "")
        if not link.startswith("http"):
            link = "https://snappin.app" + link

        head = session.head(link, allow_redirects=True, timeout=10)
        content_type = head.headers.get("content-type", "")

        if "video" in content_type:
            video_url = link
        elif "image" in content_type:
            image_url = link

    return video_url, image_url


def download_spotify_track(url):
    """تحميل من Spotify"""
    session = requests.Session()

    r = session.get("https://spotdl.io/", headers=SPOTIFY_HEADERS, timeout=10)
    soup = BeautifulSoup(r.text, "html.parser")

    csrf = soup.find("meta", {"name": "csrf-token"})
    if not csrf:
        return None

    headers = SPOTIFY_HEADERS.copy()
    headers["x-csrf-token"] = csrf["content"]

    track = session.post(
        "https://spotdl.io/getTrackData",
        json={"spotify_url": url},
        headers=headers,
        timeout=10
    ).json()

    convert = session.post(
        "https://spotdl.io/convert",
        json={"urls": url},
        headers=headers,
        timeout=30
    ).json()

    return {
        "title": track.get("title", "Unknown"),
        "artist": track.get("artist", "Unknown"),
        "url": convert.get("url")
    }


# ============================================
# MediaFire Downloader Class
# ============================================

class MFDownloader:
    def __init__(self):
        self.api = "https://www.mediafire.com/api/1.4"

    def fetch(self, url):
        if "mediafire.com" not in url.lower():
            raise Exception("Invalid Mediafire URL")

        file_match = re.search(r"mediafire\.com/file/([a-z0-9]+)", url, re.I)
        if file_match:
            return self.get_file_info(file_match.group(1))

        folder_match = re.search(r"mediafire\.com/folder/([a-z0-9]+)", url, re.I)
        if folder_match:
            return self.get_folder_content(folder_match.group(1))

        raise Exception("URL not recognized as file or folder")

    def get_file_info(self, quick_key):
        res = requests.get(
            f"{self.api}/file/get_info.php",
            params={"quick_key": quick_key, "response_format": "json"},
            timeout=10
        ).json()

        info = res.get("response", {}).get("file_info")

        if not info or info.get("ready") != "yes":
            raise Exception("File not available")

        return {
            "type": "file",
            "name": info["filename"],
            "size": int(info["size"]),
            "mimetype": info["mimetype"],
            "created": info["created"],
            "download": info["links"]["normal_download"]
        }

    def get_folder_content(self, folder_key):
        res = requests.get(
            f"{self.api}/folder/get_content.php",
            params={
                "folder_key": folder_key,
                "response_format": "json",
                "content_type": "files",
                "filter": "all",
                "order_by": "name",
                "order_direction": "asc",
                "chunk": 1,
                "version": "1.5",
                "r": str(random.random())
            },
            timeout=10
        ).json()

        files = res.get("response", {}).get("folder_content", {}).get("files", [])

        return {
            "type": "folder",
            "total": len(files),
            "files": [{
                "name": f["filename"],
                "size": int(f["size"]),
                "mimetype": f["mimetype"],
                "created": f["created"],
                "download": f["links"]["normal_download"]
            } for f in files]
        }


# ============================================
# Handlers - معالجات الرسائل
# ============================================
@bot.message_handler(func=lambda m: m.text and ("facebook.com" in m.text.lower() or "fb.watch" in m.text.lower()))
def download_facebook(message):
    if not require_subscription(message):
        return

    try:
        url = message.text.strip()
        msg = bot.reply_to(message, "🩸 جاري جلب الفيديو من فيسبوك...")

        result = download_facebook_video(url)

        if result and result["url"]:
            bot.send_video(
                message.chat.id,
                result["url"],
                caption=f"🎬 {result['title']}"
            )
            bot.delete_message(message.chat.id, msg.message_id)
        else:
            bot.edit_message_text("❌ لم أتمكن من استخراج الفيديو", message.chat.id, msg.message_id)

    except Exception as e:
        bot.reply_to(message, f"⚠️ خطأ: {str(e)}")

@bot.message_handler(commands=['start'])
def start(message):
    if not require_subscription(message):
        return

    user_name = message.from_user.first_name

    btn1 = types.InlineKeyboardButton('المطور 👨🏻‍💻', url='https://t.me/Mohnd_A1')
    btn2 = types.InlineKeyboardButton('قناة التحديثات 📁', url='https://t.me/DevX_S1')

    markup = types.InlineKeyboardMarkup(row_width=2)
    markup.add(btn1, btn2)

    welcome_text = f"""
👋🏻 أهلاً بك {user_name}

🤖 في بوت التحميل المتكامل

📌 أرسل:
• رابط TikTok
• رابط Instagram
• رابط Facebook
• رابط Pinterest 
• رابط Spotify 
• رابط MediaFire 
• رابط YouTube 
• ملف صوتي لمعرفة اسم الأغنية
• اكتب: غني + اسم الأغنية
• اكتب: تيك + اسم فيديو تيك توك
"""
    bot.send_message(message.chat.id, welcome_text, reply_markup=markup)


@bot.message_handler(content_types=['voice', 'audio', 'video'])
def detect_music(message):
    if not require_subscription(message):
        return

    temp_name = None
    try:
        bot.reply_to(message, "🎧 جاري التعرف على الأغنية...")

        if message.voice:
            file_info = bot.get_file(message.voice.file_id)
        elif message.audio:
            file_info = bot.get_file(message.audio.file_id)
        elif message.video:
            file_info = bot.get_file(message.video.file_id)
        else:
            return

        file = bot.download_file(file_info.file_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            f.write(file)
            temp_name = f.name

        result = acr.recognize_by_file(temp_name, 0)
        data = json.loads(result)

        if data.get('status', {}).get('code') != 0:
            bot.reply_to(message, "❌ لم يتم التعرف على الأغنية")
            return

        music = data['metadata']['music'][0]

        title = music.get("title", "غير معروف")
        artist = ", ".join([a.get('name', '') for a in music.get("artists", [])])
        album = music.get("album", {}).get("name", "غير معروف")
        genres = ", ".join([g.get('name', '') for g in music.get("genres", [])])
        release = music.get("release_date", "غير معروف")

        txt = f"""
❰ جبت الاغنية يسطا 🧚‍♀️ ❱

🎵 العنوان : {title}
👨‍🎤 الفنان : {artist}
💿 الألبوم : {album}
🎶 النوع : {genres}
📅 تاريخ الإصدار : {release}
"""
        bot.reply_to(message, txt)

    except Exception as e:
        bot.reply_to(message, f"⚠️ خطأ: {str(e)}")

    finally:
        if temp_name and os.path.exists(temp_name):
            try:
                os.remove(temp_name)
            except:
                pass


@bot.message_handler(func=lambda m: m.text and m.text.lower().startswith("غني"))
def play_music_auto(message):
    if not require_subscription(message):
        return

    try:
        query = message.text[3:].strip()

        if not query:
            bot.reply_to(message, "⚠️ اكتب اسم الأغنية بعد كلمة غني")
            return

        msg = bot.reply_to(message, "🎧 جاري البحث...")

        search_data = search_youtube(query)
        if not search_data:
            bot.edit_message_text("❌ لم يتم العثور على الأغنية", message.chat.id, msg.message_id)
            return

        video_id = search_data["video_id"]

        result = download_from_savetube(video_id, "audio", "128")

        caption = f"""╭──〔 🎧 معلومات الأغنية 〕──╮
│• العنوان: {search_data['title']}
│• المغني: {search_data['channel']}
│• الرابط: https://www.youtube.com/watch?v={video_id}
╰───────────────╯"""

        bot.send_photo(message.chat.id, result["thumbnail"], caption=caption)
        bot.send_audio(message.chat.id, result["download_url"])
        bot.delete_message(message.chat.id, msg.message_id)

    except Exception as e:
        bot.reply_to(message, f"❌ حدث خطأ: {str(e)}")

@bot.message_handler(func=lambda m: m.text and m.text.lower().startswith("تيك"))
def tiktok_search_auto(message):
    if not require_subscription(message):
        return

    try:
        query = message.text[3:].strip()

        if not query:
            bot.reply_to(message, "⚠️ اكتب كلمة البحث بعد كلمة تيك")
            return

        msg = bot.reply_to(message, "🔍 جاري البحث في تيك توك...")

        # طلب API
        url = f"https://terbo-api.vercel.app/api/tiks?text={query}"
        res = requests.get(url).json()

        if not res.get("status") or not res.get("videos"):
            bot.edit_message_text("❌ لم يتم العثور على نتائج", message.chat.id, msg.message_id)
            return

        video = res["videos"][0]  # أول نتيجة

        caption = f"""╭──〔 🎬 فيديو تيك توك 〕──╮
│• العنوان: {video['title']}
│• البحث: {res['query']}
╰───────────────╯"""

        # إرسال الصورة (الغلاف)
        bot.send_photo(message.chat.id, video["cover"], caption=caption)

        # إرسال الفيديو
        bot.send_video(message.chat.id, video["play"])

        bot.delete_message(message.chat.id, msg.message_id)

    except Exception as e:
        bot.reply_to(message, f"❌ حدث خطأ: {str(e)}")


@bot.message_handler(func=lambda m: m.text and "tiktok.com" in m.text.lower())
def download_tiktok(message):
    if not require_subscription(message):
        return

    try:
        url = message.text.strip()
        bot.reply_to(message, "⏳ جاري التحميل من TikTok...")

        result = download_tiktok_video(url)

        if result:
            bot.send_video(
                message.chat.id,
                video=result["video_url"],
                caption=f"✅ تم التحميل\n🎬 {result['title']}",
                thumbnail=result.get("cover")
            )
        else:
            bot.reply_to(message, "❌ الرابط غير صالح أو لم يتم العثور على الفيديو")

    except Exception as e:
        bot.reply_to(message, f"⚠️ خطأ: {str(e)}")


@bot.message_handler(func=lambda m: m.text and "instagram.com" in m.text.lower())
def download_instagram(message):
    if not require_subscription(message):
        return

    try:
        url = message.text.strip()
        bot.reply_to(message, "📥 جاري التحميل من إنستغرام...")

        video_url = download_instagram_video(url)

        if video_url:
            bot.send_video(message.chat.id, video_url, caption="✅ تم التحميل من إنستغرام")
        else:
            bot.reply_to(message, "❌ لم يتم العثور على فيديو")

    except Exception as e:
        bot.reply_to(message, f"⚠️ خطأ: {str(e)}")





@bot.message_handler(func=lambda m: m.text and ("youtube.com" in m.text.lower() or "youtu.be" in m.text.lower()))
def youtube_buttons(message):
    if not require_subscription(message):
        return

    url = message.text.strip()

    markup = types.InlineKeyboardMarkup()
    video_btn = types.InlineKeyboardButton("🎬 تحميل فيديو 360p", callback_data=f"yt_video|{url}")
    audio_btn = types.InlineKeyboardButton("🎧 تحميل صوت MP3", callback_data=f"yt_audio|{url}")
    markup.add(video_btn, audio_btn)

    bot.reply_to(message, "📌 اختر نوع التحميل:", reply_markup=markup)


@bot.callback_query_handler(func=lambda call: call.data.startswith("yt_"))
def youtube_download(call):
    try:
        mode, url = call.data.split("|", 1)

        bot.edit_message_text("⏳ جاري التحميل...", call.message.chat.id, call.message.message_id)

        result = convert_youtube(url, "video" if mode == "yt_video" else "audio")

        if not result:
            bot.send_message(call.message.chat.id, "❌ فشل التحويل، جرب مرة أخرى")
            return

        if mode == "yt_video":
            caption = f"""🎬 YouTube Video

📌 {result['title']}
📺 {result['author']}
🎞 360p"""
            bot.send_video(call.message.chat.id, result["url"], caption=caption)
        else:
            caption = f"""🎧 YouTube Audio

📌 {result['title']}
📺 {result['author']}"""
            bot.send_audio(call.message.chat.id, result["url"], caption=caption)

    except Exception as e:
        bot.send_message(call.message.chat.id, f"❌ خطأ: {str(e)}")


@bot.message_handler(func=lambda m: m.text and ("pinterest.com" in m.text.lower() or "pin.it" in m.text.lower()))
def download_pinterest(message):
    if not require_subscription(message):
        return

    try:
        url = message.text.strip()
        bot.reply_to(message, "📌 جاري تحميل من Pinterest...")

        video, image = download_pinterest_media(url)

        if video:
            bot.send_video(message.chat.id, video, caption="✅ تم تحميل الفيديو من Pinterest")
        elif image:
            bot.send_photo(message.chat.id, image, caption="🖼️ تم تحميل الصورة من Pinterest")
        else:
            bot.reply_to(message, "❌ لم يتم العثور على فيديو أو صورة")

    except Exception as e:
        bot.reply_to(message, f"⚠️ خطأ: {str(e)}")


@bot.message_handler(func=lambda m: m.text and "open.spotify.com" in m.text.lower())
def download_spotify(message):
    if not require_subscription(message):
        return

    try:
        url = message.text.strip()
        bot.reply_to(message, "🎧 جاري تحميل الأغنية من Spotify...")

        data = download_spotify_track(url)

        if not data or not data.get("url"):
            bot.reply_to(message, "❌ فشل التحميل من Spotify")
            return

        caption = f"""🎵 Spotify Downloader

📌 العنوان: {data['title']}
👤 الفنان: {data['artist']}"""

        bot.send_audio(message.chat.id, data["url"], caption=caption)

    except Exception as e:
        bot.reply_to(message, f"⚠️ خطأ: {str(e)}")


@bot.message_handler(func=lambda m: m.text and "mediafire.com" in m.text.lower())
def mediafire_auto(message):
    if not require_subscription(message):
        return

    try:
        url = message.text.strip()
        bot.reply_to(message, "📥 جاري التحميل من MediaFire...")

        mf = MFDownloader()
        result = mf.fetch(url)

        if result["type"] == "file":
            if result["size"] < 50 * 1024 * 1024:
                bot.send_document(
                    message.chat.id,
                    result["download"],
                    visible_file_name=result["name"]
                )
            else:
                text = f"""🧾 الملف كبير جداً للإرسال مباشرة

📄 الاسم: {result['name']}
📦 الحجم: {format_bytes(result['size'])}
📁 النوع: {result['mimetype']}
📅 التاريخ: {result['created']}

🔗 رابط التحميل:
{result['download']}"""
                bot.send_message(message.chat.id, text)

        else:
            msg = f"📁 الفولدر ({result['total']} ملف)\n\n"

            for i, f in enumerate(result["files"][:10], 1):
                msg += f"{i}. {f['name']}\n📦 {format_bytes(f['size'])}\n🔗 {f['download']}\n\n"

            if result['total'] > 10:
                msg += f"... و {result['total'] - 10} ملفات أخرى"

            bot.send_message(message.chat.id, msg)

    except Exception as e:
        bot.reply_to(message, f"❌ خطأ: {str(e)}")


# ============================================
# تشغيل البوت
# ============================================

if __name__ == "__main__":
    print("🤖 البوت يعمل الآن...")
    print("✅ تم تحميل جميع المعالجات بنجاح")
    bot.infinity_polling(timeout=60, long_polling_timeout=60)

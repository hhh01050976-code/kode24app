# 백엔드 기본 

import os
import random
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

load_dotenv()

app = FastAPI()

#프론트(로컬에서) 호출 가능하게 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAIL_ADDRESS = os.getenv("MAIL_ADDRESS")
MAIL_APP_PASSWORD = os.getenv("MAIL_APP_PASSWORD")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "KODE24")

#임시 저장소 
#실무에서는 Redis 또는 DB 저장
veerification_store = {}

class SendCodeRequest(BaseModel):
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

def generate_code() -> str:
    return str(random.randint(100000, 999999))

def send_email_code(to_email: str, code: str) -> None:
    subject = "[KODE24] 이메일 인증코드 안내"
    body = f"""
안녕하세요. KODE24입니다.

이메일 인증코드는 아래와 같습니다.

인증코드 : {code}

해당 코드는 5분간 유효합니다.
본인이 요청하지 않았다면 이 메일을 무시해주세요.
""".strip()
    
    msg = MIMEMultipart()
    msg["From"] = f"{MAIL_FROM_NAME} <{MAIL_ADDRESS}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain","utf-8"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(MAIL_ADDRESS, MAIL_APP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail="메일 발송 실패: {str(e)}")

@app.post("/send-verification-code")
def send_verification_code(request: SendCodeRequest):
    email = request.email.lower().strip()
    code = generate_code()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    veerification_store[email] = {
        "code" : code,
        "expires_at" : expires_at,
        "verified" : False,
    }

    send_email_code(email, code)

    return {
        "success": True,
        "message" : "인증코드를 이메일로 발송했습니다."
    }

@app.post("/verify-verification-code")
def verify_verification_code(request: VerifyCodeRequest):
    email = request.email.lower().strip()
    code = request.code.strip()

    saved = veerification_store.get(email)
    if not saved:
        raise HTTPException(status_code=400, detail="인증요청 정보가 없습니다.")
    
    if datetime.utcnow() > saved["expires_at"]:
        del veerification_store[email]
        raise HTTPException(status_code=400, detail="인증코드가 만료되었습니다.")
    
    if saved["code"] != code:
        raise HTTPException(status_code=400, detail="인증코드가 일치하지 않습니다.")
    
    saved["verified"] = True

    return{
        "success": True,
        "message": "이메일 인증이 완료되었습니다."
    }


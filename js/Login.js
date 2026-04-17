//로그인 JS


/*
[ API 연결 예정 메모 ]
- 현재 LocalStorage + 테스트 데이터 기반

나중에 실제 API 연결 시 
1) 로그인               | POST/api 
2) 회원가입             | POST/api
3) 이메일 인증           | POST/api
4) 사용자 저장           | 서버 DB + 토큰 방식 
*/

//DOM 요소들 가져오기 
const tabButtons = document.querySelectorAll(".tab-btn");
const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const appToast = document.getElementById("appToast");
const socialButtons = document.querySelectorAll(".social-btn");


//회원가입 관련 요소들 가져오기
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupId = document.getElementById("signupId");
const signupPassword = document.getElementById("signupPassword");
const signupPasswordConfirm = document.getElementById("signupPasswordConfirm");
const agreeTerms = document.getElementById("agreeTerms");

const nameMsg = document.getElementById("nameMsg");
const emailMsg = document.getElementById("emailMsg");
const idMsg = document.getElementById("idMsg");
const passwordMsg = document.getElementById("passwordMsg");
const passwordConfirmMsg = document.getElementById("passwordConfirmMsg");

const sendCodeBtn = document.getElementById("sendCodeBtn");
const codeModal = document.getElementById("codeModal");
const closeCodeModal = document.getElementById("closeCodeModal");
const verifyCodeBtn = document.getElementById("verifyCodeBtn");
const emailCodeInput = document.getElementById("emailCodeInput");

//상태값
let generatedEmailCode = "";
let isEmailVerified = false;

const LOGIN_USER_KEY = "kode24_login_user";
const LOGIN_REDIRECT_KEY = "kode24_login_redirect_after";
const USERS_KEY = "kode24_users";

/*======================
토스트 메세지 출력 함수 
================*/
function showToast(message){
    appToast.textContent = message;
    appToast.classList.add("show");

    clearTimeout(appToast._toastTimer);
    appToast._toastTimer = setTimeout(() => {
        appToast.classList.remove("show");
    }, 1800);
}


/*======================
탭을 클릭하면 로그인 / 회원가입 화면 전환
================*/

function switchTab(tabName) {

    //탭 버튼으로 상태 변경
    tabButtons.forEach((button) => {
        button.classList.toggle("active" , button.dataset.tab === tabName);
    });
    //패널 표시 숨김
    loginPanel.classList.toggle("active", tabName === "login");
    signupPanel.classList.toggle("active", tabName === "signup");
}
//탭 버튼 값 읽어서 전환하기 
tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
    });
});


/* =====================

관리자 로그인 처리 함수 

====================*/
function handleLogin(event){
    event.preventDefault();

    const idInput = document.getElementById("loginId").value.trim();
    const pwInput = document.getElementById("loginPassword").value.trim();

    //현재 하드코딩 관리자 계정
    //나중에 관리자 로그인 API 필요 
    const adminId = "kode24";
    const adminPw = "kode24qaz!!";

    if(idInput === adminId && pwInput === adminPw){
        localStorage.setItem("isAdminLogin", "true");
        location.href = "./admin/AdminDashboard.html";
        return;
    }
    showToast("아이디 또는 비밀번호가 올바르지 않습니다.");
}

//회원가입 로그인 정보
function handleLoginSuccess(loginUser) {
    localStorage.setItem(LOGIN_USER_KEY, JSON.stringify(loginUser));

    const redirectPath = localStorage.getItem(LOGIN_REDIRECT_KEY);

    if (redirectPath) {
        localStorage.removeItem(LOGIN_REDIRECT_KEY);
        location.replace(redirectPath);
        return;
    }

    location.replace("/index.html");
}

/*=============================
유틸 ( 문구 )
===============================*/
function setMessage(el,text,type = ""){
    el.textContent = text;
    el.classList.remove("error", "success");

    if(type){
        el.classList.add(type);
    }
}
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));   
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find((user) => user.email === email);
}

function findUserById(userId){
    const users = getUsers();
    return users.find((user) => user.userId === userId);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 이름: 2~4글자 한글/영문
function isValidName(name) {
  return /^[가-힣a-zA-Z]{2,4}$/.test(name);
}

//아이디
function isValidUserId(userId){
    return /^[a-zA-Z0-9_]{4,12}$/.test(userId);
}

// 비밀번호: 7~10자 + 특수문자 포함
function isValidPassword(password) {
  const lengthOk = /^.{7,14}$/.test(password);
  const specialOk = /[!@#$%^&*(),.?":{}|<>_\-\\/\[\]=+~`]/.test(password);
  return lengthOk && specialOk;
}

function openCodeModal() {
  codeModal.classList.add("show");
}

function closeCodeModalFn() {
  const modal = document.getElementById("codeModal");
  const codeInput = document.getElementById("emailCodeInput");

  if (!modal) return;

  modal.classList.remove("show");

  if (codeInput) {
    codeInput.value = "";
  }
}
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/*======================
실시간 검사 문장 함수
================*/
signupName.addEventListener("input", () => {
    const name = signupName.value.trim();

    if(!name) {
        setMessage(nameMsg,"");
        return;
    }
    if(!isValidName(name)){
        setMessage(nameMsg, "이름은 2-4글자로 입력해주세요.","error");
        return;
    }
    setMessage(nameMsg,"확인 되었습니다.","success");
});

signupEmail.addEventListener("input", () => {
    const email = signupEmail.value.trim();
    isEmailVerified = false;

    if (!email) {
        setMessage(emailMsg, "");
        return;
    }

    if (!isValidEmail(email)) {
        setMessage(emailMsg, "올바른 이메일 형식으로 입력해주세요." ,"error");
        return;
    }

    setMessage(emailMsg, "이메일 형식이 확인되었습니다. 인증요청을 진행해주세요.","success");
});

signupId.addEventListener("input", () => {
    const userId = signupId.value.trim();

    if (!userId) {
        setMessage(idMsg, "");
        return;
    }

    if (!isValidUserId(userId)) {
        setMessage(idMsg, "아이디는 4~12자 영문, 숫자, _만 사용 가능합니다.", "error");
        return;
    }

    if (findUserById(userId)) {
        setMessage(idMsg, "이미 사용 중인 아이디입니다.", "error");
        return;
    }

    setMessage(idMsg, "사용 가능한 아이디입니다.", "success");
});

signupPassword.addEventListener("input", () => {
    const password = signupPassword.value.trim();

    if (!password) {
        setMessage(passwordMsg, "비밀번호는 7~14자 / 특수문자 포함으로 입력해주세요.", "error");
        return;
    }

    if (!isValidPassword(password)) {
        setMessage(passwordMsg, "형식에 맞게 작성해주세요. (7~14자 / 특수문자 포함)", "error");
        return;
    }

    setMessage(passwordMsg, "확인되었습니다.", "success");

    const confirmValue = signupPasswordConfirm.value.trim();
    if (confirmValue) {
        if (password === confirmValue) {
            setMessage(passwordConfirmMsg, "확인되었습니다.", "success");
        } else {
            setMessage(passwordConfirmMsg, "비밀번호가 서로 다릅니다.", "error");
        }
    }
});

signupPasswordConfirm.addEventListener("input", () => {
    const password = signupPassword.value.trim();
    const confirmValue = signupPasswordConfirm.value.trim();

    if(!confirmValue) {
        setMessage(passwordConfirmMsg, "");
        return;
    }
    if(password !== confirmValue){
        setMessage(passwordConfirmMsg, "비밀번호가 서로 다릅니다.","error");
        return;
    }
    setMessage(passwordConfirmMsg, "확인되었습니다.","success");
});



// ================================
// 이메일 인증 요청 => 나중에 실제 API로 이메일 인증요청 보내기! 지금은 프론트로만 테스트 
// ================================
sendCodeBtn.addEventListener("click", async () => {
  const email = signupEmail.value.trim();

  if (!email) {
    showToast("이메일을 먼저 입력해주세요.");
    return;
  }

  if (!isValidEmail(email)) {
    showToast("이메일 형식을 먼저 확인해주세요.");
    return;
  }

  if (findUserByEmail(email)) {
    showToast("이미 가입된 이메일입니다.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/send-verification-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.detail || "인증코드 발송에 실패했습니다.");
      return;
    }

    isEmailVerified = false;
    showToast("인증코드를 보냈습니다.");
    openCodeModal();
  } catch (error) {
    console.error("인증코드 발송 오류:", error);
    showToast("서버 연결에 실패했습니다.");
  }
});


/* 이메일 인증 확인 ( API ) */
verifyCodeBtn.addEventListener("click", async () => {
  const email = signupEmail.value.trim();
  const inputCode = emailCodeInput.value.trim();

  if (!inputCode) {
    showToast("인증코드를 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/verify-verification-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        code: inputCode
      })
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.detail || "인증코드가 일치하지 않습니다.");
      return;
    }

    isEmailVerified = true;
    setMessage(emailMsg, "인증되었습니다.", "success");
    closeCodeModalFn();
    showToast("이메일 인증이 완료되었습니다.");
  } catch (error) {
    showToast("서버 연결에 실패했습니다.");
  }
});

if(closeCodeModal){
    closeCodeModal.addEventListener("click", closeCodeModalFn)
}

if(codeModal){
    codeModal.addEventListener("click", (event) => {
        if(event.target === codeModal){
            closeCodeModalFn();
        }
    })
}


/*======================
비밀번호 보기/숨기기 토글
======================*/
const toggleButtons = document.querySelectorAll(".toggle-password");

toggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);

    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      btn.src = "../img/open.png";   // 👁 열림
    } else {
      input.type = "password";
      btn.src = "../img/rock.png";   // 🔒 닫힘
    }
  });
});


/*======================
로그인 처리하는 함수 ( API )
================*/
loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const userId = document.getElementById("loginId").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (!userId || !password) {
            showToast("아이디와 비밀번호를 입력해주세요.");
            return;
        }

        // 기본 테스트 계정
        const testUserId = "test";
        const testPassword = "1234!";

        if (userId === testUserId && password === testPassword) {
            const loginUser = {
                userId: testUserId,
                name: "코드24",
                email: "test@kode24.com",
                isLoggedIn: true
            };

            showToast("로그인 되었습니다.");

            setTimeout(() => {
                handleLoginSuccess(loginUser);
            }, 700);
            return;
        }

        // 회원가입 사용자 로그인
        const users = getUsers();
        const foundUser = users.find(
            (user) => user.userId === userId && user.password === password
        );

        if (!foundUser) {
            showToast("아이디 또는 비밀번호가 올바르지 않습니다.");
            return;
        }

        const loginUser = {
            userId: foundUser.userId,
            name: foundUser.name,
            email: foundUser.email,
            isLoggedIn: true
        };

        showToast("로그인 되었습니다.");

        setTimeout(() => {
            handleLoginSuccess(loginUser);
        }, 700);
});

/*======================
회원가입 함수 ( API )
================*/
signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const userId = document.getElementById("signupId").value.trim();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const passwordConfirm = document.getElementById("signupPasswordConfirm").value.trim();
    const agreeTerms = document.getElementById("agreeTerms").checked;

    if (!userId || !name || !email || !password || !passwordConfirm) {
        showToast("회원가입 정보를 모두 입력해주세요.");
        return;
    }

    if (!isValidUserId(userId)) {
        showToast("아이디는 4~12자 영문, 숫자, _만 사용 가능합니다.");
        return;
    }

    if (findUserById(userId)) {
        showToast("이미 사용 중인 아이디입니다.");
        return;
    }

    if (!isValidName(name)) {
        showToast("이름은 2~4글자로 입력해주세요.");
        return;
    }

    if (!isValidEmail(email)) {
        showToast("올바른 이메일 형식으로 입력해주세요.");
        return;
    }

    if (findUserByEmail(email)) {
        showToast("이미 가입된 이메일입니다.");
        return;
    }

    if (!isValidPassword(password)) {
        showToast("비밀번호는 7~14자 / 특수문자 포함으로 입력해주세요.");
        return;
    }

    if (password !== passwordConfirm) {
        showToast("비밀번호가 서로 다릅니다.");
        return;
    }

    if (!agreeTerms) {
        showToast("개인정보 동의가 필요합니다.");
        return;
    }

    if (!isEmailVerified) {
        showToast("이메일 인증을 완료해주세요.");
        return;
    }

    const users = getUsers();

    users.push({
        userId,
        name,
        email,
        password
    });

    saveUsers(users);

    showToast("회원가입이 완료되었습니다. 로그인해주세요.");

    switchTab("login");
    document.getElementById("loginId").value = userId;
    document.getElementById("loginPassword").value = "";

    signupForm.reset();
    generatedEmailCode = "";
    isEmailVerified = false;

    setMessage(idMsg, "");
    setMessage(nameMsg, "");
    setMessage(emailMsg, "");
    setMessage(passwordMsg, "");
    setMessage(passwordConfirmMsg, "");
});

/*======================
소셜 로그인 함수 
================*/
//나중에 카카오 / 구글 / 애플 OAuth 연동
    socialButtons.forEach((button) => {
    button.addEventListener("click", () => {
        //버튼에 설정된 값 읽어오기
        const provider = button.dataset.social;

        //각 값에 맞는 설정 맞는지 확인 후 나오는 문장
        if (provider === "kakao") {
        showToast("카카오 간편 로그인 되었습니다.");
        return;
        }

        if (provider === "google") {
        showToast("Google 간편 로그인 되었습니다.");
        return;
        }

        if (provider === "apple") {
        showToast("Apple 간편 로그인 되었습니다 .");
        }
    });
});
//
//
//
//
//
//개인 정보 js


//DOM 요소 가져오고
const appToast = document.getElementById("appToast");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPhone = document.getElementById("userPhone");
const userPurpose = document.getElementById("userPurpose");
const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");
const saveRow = document.getElementById("saveRow");

//로컬스토리에 저장할 키 이름
const PROFILE_KEY ="kode24_profile_info";

/*=========================
[ API 연결 예정 메모]
현재 구조는 
- 로컬 스토리에 개인 정보 저장 및 조회 
- defaultProfiel로 기본 더미 데이터 사용 중

실제 API 연결 시 핵심 변경 위치 
1) defaultProfile =>  제거 가능 
2) getProfileData() => 내 정보 조회 API로 변경
3) 저장 버튼 클릭 부분 => 내 정보 수정 API로 변경
4) renderProfile() => API 응답값 기준 렌더링 
==========================*/



//처음 접속 할때 사용할 기본 프로필 데이터 
// 나중에 실제 API 연결 시 서버에서 받아온 사용자 정보로 대체 
const defaultProfile = {
    name: "코드24님",
    email: "test@kode24.com",
    phone: "010-1234-5678",
    purpose: "상담 / 자가진단 / 증거보존"
};

let isEditMode = false;


//토스트 출력 함수 
function showToast(message) {
    appToast.textContent = message;
    appToast.classList.add("show");

    //중복 방지
    clearTimeout(appToast._toastTimer);

    //1.8초 후 자동 숨김
    appToast._toastTimer = setTimeout(() => {
        appToast.classList.remove("show");
    }, 1800);
}

//뒤로가기
function goBack() {
  location.href = "./MyPage.html";
}

//프로필 데이터 가져오기 
function getProfileData() {

    //로컬 스토리에 있는 데이터 가지고 오기 
    const saved = localStorage.getItem(PROFILE_KEY);

    //데이터가 없으면 기본값 
    if(!saved) {
        localStorage.setItem(PROFILE_KEY,JSON.stringify(defaultProfile));
        return defaultProfile;
    }

    //데이터 있으면 객체로 변환해서 변환
    return JSON.parse(saved);
}


//화면에 프로필 표시 
function renderProfile() {

    //저장된 데이터 가지고 오고
    const profile = getProfileData();

    //각 input 안에 데이터 값 넣기 
    userName.value = profile.name || "";
    userEmail.value = profile.email || "";
    userPhone.value = profile.phone || "";
    userPurpose.value = profile.purpose || "";
}

//수정 모드 on/off 하는 함수 
function setEditMode(enabled) {

    //수정 상태 저장 하고 
    isEditMode = enabled;

    //input 활성화 비활성화 
    userName.disabled = !enabled;
    userEmail.disabled = !enabled;
    userPhone.disabled = !enabled;
    userPurpose.disabled = !enabled;

    //저장 취소 버튼 영역 표시 여부 
    saveRow.classList.toggle("hidden", !enabled);
    editBtn.textContent = enabled ? "수정 중" : "수정하기";

    //수정 중일때 버튼 비활성화 (중복 클릭 방지 겸)
    editBtn.disabled = enabled;
}


//이벤트 수정 버튼 클릭 함수 
editBtn.addEventListener("click", () => {
  setEditMode(true);
});


//취소 버튼 클릭 함수 
cancelBtn.addEventListener("click", () => {

    //기존 데이터 다시 렌더링 
    renderProfile();
    //수정 모드 종료
    setEditMode(false);

    //사용자에게 뜨는 알림 
    showToast("수정이 취소되었습니다.");
});


//저장 버튼 클릭 
saveBtn.addEventListener("click", () => {

    //입력값 가져오고 
    const newProfile = {
    name: userName.value.trim(),
    email: userEmail.value.trim(),
    phone: userPhone.value.trim(),
    purpose: userPurpose.value.trim()
    };

    //로컬스토리에 저장
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));

    //수정 모드 종료 
    setEditMode(false);

    //사용자에게 뜨는 알림
    showToast("회원정보가 저장되었습니다.");
});



//페이지 로드 시 데이터 표시 
//현재 로컬스토리에서 렌더링 
// 나중에 API로 프로필 조회 후 renderProfile() 실행 
renderProfile();
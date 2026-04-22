// Support.js
// 예방 교육 신청 페이지 전용 JS

/* 
[ API 연결 예정 메모 ]
 현재
- 상담 신청 데이터를 localStorage("kode24_consltation_history에 저장")
- 마이페이지 /  관리자 페이지에서 해당 데이터 사용

나중에 API 연결 시 핵심 변경
1) getConsultationData()
2) saveConsultationData()
3) initFormSubmit()


*/

//뒤로가기
window.goBack = function () {
  history.back();
}

document.addEventListener("DOMContentLoaded", () => {
  initHeroSlider();      // 상단 배경 슬라이드
  initReviewTicker();    // 후기 자동 스크롤
  initApplyModal();      // 신청 모달 제어
  initFormSubmit();      // 신청 폼 제출
  initButtonEffect();    // 버튼 눌림 효과
  initPhoneAutoFormat();
  initEmailValidation();
});

const CONSULT_KEY = "kode24_consultation_history";

//상담 데이터 가져오기 
function getConsultationData() {
  const saved = localStorage.getItem(CONSULT_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("상담 데이터 파싱 실패:", error);
    return [];
  }
}
//상담 데이터 저장 
function saveConsultationData(data) {
  localStorage.setItem(CONSULT_KEY, JSON.stringify(data));
}
//오늘 날짜 문자열 생성
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
/* ---------------------------
   1. 배경 자동 슬라이드
--------------------------- */
//히어로 영역 이미지 자동 전화 
function initHeroSlider() {
  const images = document.querySelectorAll(".hero-img");
  if (!images.length) return;

  let current = 0;

  function changeSlide() {
    images[current].classList.remove("active");
    current = (current + 1) % images.length;
    images[current].classList.add("active");
  }

  setInterval(changeSlide, 3000);
}

/* ---------------------------
   2. 후기 자동 스크롤
--------------------------- */
//후기 리스트 자동 롤링 애니메이션
function initReviewTicker() {
  const track = document.getElementById("reviewTrack");
  if (!track) return;

  const originalItems = Array.from(track.children);
  if (!originalItems.length) return;

  // 후기 복제
  originalItems.forEach((item) => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });

  let y = 0;
  const speed = 0.4;
  let paused = false;
  const gap = 12;

  const originalHeight =
    originalItems.reduce((sum, item) => sum + item.offsetHeight, 0) +
    (originalItems.length - 1) * gap;

  function animate() {
    if (!paused) {
      y += speed;

      if (y >= originalHeight) {
        y = 0;
      }

      track.style.transform = `translateY(-${y}px)`;
    }

    requestAnimationFrame(animate);
  }

  // PC 멈춤/재시작
  track.addEventListener("mouseenter", () => {
    paused = true;
  });

  track.addEventListener("mouseleave", () => {
    paused = false;
  });

  // 모바일 멈춤/재시작
  track.addEventListener("touchstart", () => {
    paused = true;
  });

  track.addEventListener("touchend", () => {
    paused = false;
  });

  animate();
}

/* ---------------------------
   3. 신청 모달 제어
--------------------------- */
//신청 모달 열고 닫기 
function initApplyModal() {
  const modal = document.getElementById("applyModal");
  if (!modal) return;

  // HTML onclick="openApplyModal()" 용
  window.openApplyModal = function () {
    modal.classList.add("show");
    document.body.classList.add("modal-open");

    // 페이드/슬라이드용 클래스
    requestAnimationFrame(() => {
      modal.classList.add("visible");
    });
  };

  // HTML onclick="closeApplyModal()" 용
  window.closeApplyModal = function () {
    modal.classList.remove("visible");

    setTimeout(() => {
      modal.classList.remove("show");
      document.body.classList.remove("modal-open");
    }, 250);
  };

  // 바깥 영역 클릭 시 닫기
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      window.closeApplyModal();
    }
  });

  // ESC 키 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      window.closeApplyModal();
    }
  });
}

/* ---------------------------
   4. 신청 폼 제출
--------------------------- */
//상담 신청 데이터 생성 및 저장
function initFormSubmit() {
  const applyForm = document.getElementById("applyForm");
  if (!applyForm) return;

  const submitBtn = applyForm.querySelector(".submit-btn");
  if (!submitBtn) return;

  applyForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(applyForm);

    const organization = formData.get("organization")?.trim() || "";
    const manager = formData.get("manager")?.trim() || "";
    const phone = formData.get("phone")?.trim() || "";
    const email = formData.get("email")?.trim() || "";
    if(email && !email.includes("@")){
      alert("이메일 형식이 올바르지 않습니다.");
      return;
    }
    const target = formData.get("target")?.trim() || "";
    const type = formData.get("type")?.trim() || "";
    const inquiry = formData.get("message")?.trim() || "";

    // 필수값 체크
    if (!organization || !manager || !phone || !target || !type) {
      showToast("필수 항목을 입력해주세요.");
      return;
    }

    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = "접수 중...";

    // 앱 테스트용 localStorage 저장
    const newConsultation = {
      id: Date.now(),
      category: "예방 교육 신청",
      title: "예방 교육 신청",
      date: getTodayString(),
      status: "접수 완료",
      organization,
      manager,
      phone,
      email,
      target,
      method: type,
      inquiry,
      content: inquiry || `${organization} / ${manager} / ${target} / ${type}`
    };

    const list = getConsultationData();
    list.unshift(newConsultation);
    saveConsultationData(list);

    setTimeout(() => {
      showToast("신청 내용이 접수되었습니다.");

      applyForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      window.closeApplyModal();
    }, 800);
  });
}


/* ---------------------------
   5. 버튼 눌림 효과
--------------------------- */
//버튼 클릭 시 눌림 애니메이션 처리 
function initButtonEffect() {
  const buttons = document.querySelectorAll(
    ".cta-btn, .back-btn, .close-btn, .submit-btn"
  );

  buttons.forEach((button) => {
    // PC 눌림
    button.addEventListener("mousedown", () => {
      button.classList.add("pressed");
    });

    button.addEventListener("mouseup", () => {
      button.classList.remove("pressed");
    });

    button.addEventListener("mouseleave", () => {
      button.classList.remove("pressed");
    });

    // 모바일 눌림
    button.addEventListener("touchstart", () => {
      button.classList.add("pressed");
    });

    button.addEventListener("touchend", () => {
      button.classList.remove("pressed");
    });
  });
}

//전화 번호 자동 하이픈
function initPhoneAutoFormat(){
  const phoneInput = document.querySelector('input[name="phone"]');
  if(!phoneInput) return;

  phoneInput.addEventListener("input",() => {
    const numbers = phoneInput.value.replace(/\D/g, "");

    if(numbers.length < 4){
      phoneInput.value = numbers;
    }else if (numbers.length < 8 ){
      phoneInput.value = `${numbers.slice(0,3)}-${numbers.slice(3)}`;
    }else {
      phoneInput.value = `${numbers.slice(0,3)}-${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
    }
  });
}

//이메일 검증
function initEmailValidation(){
  const emailInput = document.querySelector('input[name="email"]');
  if(!emailInput) return;

  emailInput.addEventListener("blur", () => {
    const value = emailInput.value.trim();

    if(!value) return;

    if(!value.includes("@")){
      emailInput.classList.add("input-error");
      showToast("이메일 형식이 올바르지 않습니다. @를 포함해주세요.");
      emailInput.focus();
  } else{
    emailInput.classList.remove("input-error");
  }
  });
}

//토스트 메세지 표시 함수
function showToast(message){
  const toast = document.getElementById("toast");
  if(!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  clearTimeout(showToast._timer);

  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 300);
  }, 2000);
}
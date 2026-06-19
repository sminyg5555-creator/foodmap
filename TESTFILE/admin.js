const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  const id = document.getElementById("adminId").value;
  const password = document.getElementById("adminPw").value;
  const message = document.getElementById("message");

  if (!id || !password) {
    message.innerText = "아이디와 비밀번호를 입력해주세요.";
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        password
      })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("isAdminLogin", "true");
      window.location.href = "restaurant-register.html";
    } else {
      message.innerText = result.message;
    }

  } catch (error) {
    console.error(error);
    message.innerText = "서버 연결 실패";
  }
});
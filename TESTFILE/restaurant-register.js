if (localStorage.getItem("isAdminLogin") !== "true") {
  alert("관리자 로그인이 필요합니다.");
  window.location.href = "admin.html";
}

const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

const saveEditBtn = document.getElementById("saveEditBtn");
const tag = document.getElementById("editTag").value;
const closeEditBtn = document.getElementById("closeEditBtn");

const geocoder = new kakao.maps.services.Geocoder();

function getCoordsByAddress(address) {
  return new Promise((resolve, reject) => {
    geocoder.addressSearch(address, function (result, status) {
      if (status === kakao.maps.services.Status.OK) {
        resolve({
          latitude: Number(result[0].y),
          longitude: Number(result[0].x),
        });
      } else {
        reject("주소를 좌표로 변환하지 못했습니다.");
      }
    });
  });
}

registerBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;
  const place_url = document.getElementById("place_url").value;
  const address = document.getElementById("address").value;

  try {
    const coords = await getCoordsByAddress(address);

    const response = await fetch("http://localhost:3000/restaurants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  name,
  category,
  place_url,
  address,
  tag,
  latitude: coords.latitude,
  longitude: coords.longitude,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("음식점 등록이 완료되었습니다!");

      document.getElementById("message").innerText = "등록 완료";

      document.getElementById("name").value = "";
      document.getElementById("category").value = "";
      document.getElementById("place_url").value = "";
      document.getElementById("address").value = "";

      loadRestaurants();
    } else {
      alert("등록 실패");
      document.getElementById("message").innerText = "등록 실패";
    }
  } catch (error) {
    alert("등록 중 오류가 발생했습니다.");
    document.getElementById("message").innerText = error;
  }
});

async function loadRestaurants() {
  const response = await fetch("http://localhost:3000/restaurants");
  const restaurants = await response.json();

  const restaurantList = document.getElementById("restaurantList");

  restaurantList.innerHTML = "";

  restaurants.forEach((restaurant) => {
    restaurantList.innerHTML += `
      <div class="restaurant-card">
        <h3>${restaurant.name}</h3>
        <p>${restaurant.category}</p>
        <p>${restaurant.address}</p>

        <button onclick="editRestaurant(${restaurant.id})">
          수정
        </button>

        <button onclick="deleteRestaurant(${restaurant.id})">
          삭제
        </button>
      </div>
    `;
  });
}

async function deleteRestaurant(id) {
  const confirmDelete = confirm("정말 삭제하시겠습니까?");

  if (!confirmDelete) return;

  const response = await fetch(`http://localhost:3000/restaurants/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (result.success) {
    alert("삭제되었습니다.");
    loadRestaurants();
  } else {
    alert("삭제 실패");
  }
}

async function loadRequests() {
  const response = await fetch("http://localhost:3000/restaurant-requests");
  const requests = await response.json();

  const requestList = document.getElementById("requestList");

  requestList.innerHTML = "";

  requests.forEach((request) => {
    requestList.innerHTML += `
      <div class="pending-card">
        <h3>${request.name}</h3>
        <p>${request.category}</p>
        <p>${request.address}</p>

        <button onclick="approveRequest(${request.id})">승인</button>
        <button onclick="rejectRequest(${request.id})">거절</button>
      </div>
    `;
  });
}

async function approveRequest(id) {
  const confirmApprove = confirm("이 맛집을 승인하시겠습니까?");

  if (!confirmApprove) return;

  const response = await fetch(
    `http://localhost:3000/restaurant-requests/${id}/approve`,
    {
      method: "POST",
    }
  );

  const result = await response.json();

  if (result.success) {
    alert("승인되었습니다.");
    loadRequests();
    loadRestaurants();
  } else {
    alert(result.message);
    loadRequests();
  }
}

async function rejectRequest(id) {
  const confirmReject = confirm("이 맛집 제보를 거절하시겠습니까?");

  if (!confirmReject) return;

  const response = await fetch(
    `http://localhost:3000/restaurant-requests/${id}/reject`,
    {
      method: "POST",
    }
  );

  const result = await response.json();

  if (result.success) {
    alert("거절되었습니다.");
    loadRequests();
  } else {
    alert("거절 실패");
  }
}

async function editRestaurant(id) {
  const response = await fetch("http://localhost:3000/restaurants");
  const restaurants = await response.json();

  const restaurant = restaurants.find((item) => item.id === id);

  if (!restaurant) {
    alert("음식점을 찾을 수 없습니다.");
    return;
  }

  document.getElementById("editId").value = restaurant.id;
  document.getElementById("editName").value = restaurant.name;
  document.getElementById("editCategory").value = restaurant.category;
  document.getElementById("editPlaceUrl").value = restaurant.place_url;
  document.getElementById("editAddress").value = restaurant.address;
  document.getElementById("editTag").value = restaurant.tag || "";

  document.getElementById("editModal").style.display = "block";
}

closeEditBtn.addEventListener("click", () => {
  document.getElementById("editModal").style.display = "none";
});

saveEditBtn.addEventListener("click", async () => {
  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value;
  const category = document.getElementById("editCategory").value;
  const place_url = document.getElementById("editPlaceUrl").value;
  const address = document.getElementById("editAddress").value;
  const tag = document.getElementById("editTag").value;

  try {
    const coords = await getCoordsByAddress(address);

    const response = await fetch(`http://localhost:3000/restaurants/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        category,
        place_url,
        address,
        tag,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("수정 완료");
      document.getElementById("editModal").style.display = "none";
      loadRestaurants();
    } else {
      alert("수정 실패");
    }
  } catch (error) {
    alert("수정 중 오류가 발생했습니다.");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("isAdminLogin");
  alert("로그아웃 되었습니다.");
  window.location.href = "admin.html";
});

loadRestaurants();
loadRequests();
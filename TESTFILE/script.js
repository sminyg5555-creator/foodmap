
let isFavoriteView = false;
let favoriteList = JSON.parse(localStorage.getItem("favoriteList")) || [];

function saveFavoriteList() {
  localStorage.setItem("favoriteList", JSON.stringify(favoriteList));
}

function isFavorite(id) {
  return favoriteList.includes(id);
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    favoriteList = favoriteList.filter(favId => favId !== id);
  } else {
    favoriteList.push(id);
  }

saveFavoriteList();
updateFavoriteCount();

closeMarker();
closeInfowindow();

restaurantMarkerList = [];

function toggleFavorite(id) {
  if (isFavorite(id)) {
    favoriteList = favoriteList.filter(favId => favId !== id);
  } else {
    favoriteList.push(id);
  }

  saveFavoriteList();
  updateFavoriteCount();

  closeMarker();
  closeInfowindow();
  restaurantMarkerList = [];

  if (isFavoriteView) {
    const favoriteData = dataSet.filter(data =>
      favoriteList.includes(data.id)
    );

    setMap(favoriteData);
  } else {
    setMap(dataSet);
  }
}
}

function updateFavoriteCount() {
  const favoriteViewBtn =
    document.getElementById("favoriteViewBtn");

  favoriteViewBtn.textContent =
    `⭐ 즐겨찾기 보기 (${favoriteList.length})`;
}
const soloTag = document.getElementById("soloTag");
const dateTag = document.getElementById("dateTag");
const groupTag = document.getElementById("groupTag");
var mapContainer = document.getElementById('map'),  
    mapOption = { 
        center: new kakao.maps.LatLng(37.400826, 127.114015), 
        level: 3 
    };

var map = new kakao.maps.Map(mapContainer, mapOption); 

let markerArray = [];
let infowindowArray = [];

let restaurantMarkerList = [];


var mapTypeControl = new kakao.maps.MapTypeControl();


map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);


var zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

// 아래 코드는 지도 위의 마커를 제거하는 코드입니다
// marker.setMap(null);

let dataSet = [];

const categoryImageMap = {
  한식: "./한식.png",
  중식: "./중식.png",
  일식: "./라멘.png",
  양식: "./서양 음식.png",
  해외음식: "./해외음식.png",
  카페: "./카페.png"
};

async function loadData() {
  const response = await fetch("/restaurants");
  const data = await response.json();

  dataSet = data.map(item => ({
  id: item.id,
  title: item.name,
  address: item.address,
  placeUrl: item.place_url,
  category: item.category,
  tag: item.tag,
  latitude: Number(item.latitude),
  longitude: Number(item.longitude),
  image: categoryImageMap[item.category]
}));

  setMap(dataSet);
}

/* 마커 여러개 표시 */

// 주소-좌표 변환 객체를 생성합니다
/*
**********************************************************
3. 여러개 마커 찍기
  * 주소 - 좌표 변환
https://apis.map.kakao.com/web/sample/multipleMarkerImage/ (여러개 마커)
https://apis.map.kakao.com/web/sample/addr2coord/ (주소로 장소 표시하기)
*/

// 주소 - 좌표 변환 함수 (비동기 문제 발생 해결) ****************
// 주소-좌표 변환 객체를 생성합니다
var geocoder = new kakao.maps.services.Geocoder();

function getCoordsByAddress(address) {
  return new Promise((resolve, reject) => {
    geocoder.addressSearch(address, function (result, status) {
      if (status === kakao.maps.services.Status.OK) {
        resolve({
          latitude: Number(result[0].y),
          longitude: Number(result[0].x)
        });
      } else {
        reject("주소를 정확히 입력해주세요.");
      }
    });
  });
}


/* 
******************************************************************************
4. 마커에 인포윈도우 붙이기
  * 마커에 클릭 이벤트로 인포윈도우 https://apis.map.kakao.com/web/sample/multipleMarkerEvent/
  * url에서 섬네일 따기
  * 클릭한 마커로 지도 센터 이동 https://apis.map.kakao.com/web/sample/moveMap/
*/

async function setMap(dataSet) {
  const positionGroups = {};

  // 좌표 기준으로 그룹 묶기
  dataSet.forEach((data) => {
    const key = `${data.latitude.toFixed(5)},${data.longitude.toFixed(5)}`;

    if (!positionGroups[key]) {
      positionGroups[key] = [];
    }

    positionGroups[key].push(data);
  });

  // 그룹별로 마커 생성
  Object.values(positionGroups).forEach((group) => {
    group.forEach((data, index) => {
      let lat = data.latitude;
      let lng = data.longitude;

      if (group.length > 1) {
        const radius = 0.00008;
        const angle = (2 * Math.PI * index) / group.length;

        lat += radius * Math.sin(angle);
        lng += radius * Math.cos(angle);
      }

      const position = new kakao.maps.LatLng(lat, lng);

      const marker = new kakao.maps.Marker({
        map: map,
        position: position,
      });

      markerArray.push(marker);

      const infowindow = new kakao.maps.InfoWindow({
        content: getContent(data),
        disableAutoPan: true,
      });

      infowindowArray.push(infowindow);

      restaurantMarkerList.push({
        data: data,
        marker: marker,
        infowindow: infowindow,
        position: position,
      });

      kakao.maps.event.addListener(
        marker,
        "click",
        makeOverListener(map, marker, infowindow, position)
      );

      kakao.maps.event.addListener(
        map,
        "click",
        makeOutListener(infowindow)
      );
    });
  });
}


// 인포윈도우를 표시하는 클로저를 만드는 함수입니다
/* 
  커스텀
  1. 클릭시 다른 인포윈도우 닫기
  2. 클릭한 곳으로 지도 중심 이동하기
  */

function makeOverListener(map, marker, infowindow, position) {
  return function () {
    // 1. 클릭시 다른 인포윈도우 닫기
    closeInfowindow();
    infowindow.open(map, marker);
    // 2. 클릭한 곳으로 짇 중심 이동하기
    map.panTo(position);
  };
}

// 커스텀
// 1. 클릭시 다른 인포윈도우 닫기
function closeInfowindow() {
  for (let infowindow of infowindowArray) {
    infowindow.close();
  }
}

// 인포윈도우를 닫는 클로저를 만드는 함수입니다
function makeOutListener(infowindow) {
  return function () {
    infowindow.close();
  };
}

// HTML 코드로 바꾸는 함수
function getContent(data) {

  const result = `
  <div class="infowindow">

    <div class="infowindow-img-container">
      <img src="${data.image}" class="infowindow-img">
    </div>

    <div class="infowindow-body">

      <h5 class="infowindow-title">
        ${data.title}
      </h5>

      <p class="infowindow-text">
        ${data.address}
      </p>

      <a href="${data.placeUrl}" 
         target="_blank"
         class="infowindow-btn">
         카카오맵 이동
      </a>

    <button
  class="favorite-btn ${isFavorite(data.id) ? "active" : ""}"
  onclick="toggleFavorite(${data.id})">
  ${isFavorite(data.id) ? "★ 즐겨찾기 해제" : "☆ 즐겨찾기"}
</button>

    </div>

  </div>
  `;

  return result;
}

loadData();

updateFavoriteCount();

// 주소로 좌표를 검색합니다

//카테고리
async function setCategoryMap(dataSet) {
  for (var i = 0; i < dataSet.length; i++) {
    let position = new kakao.maps.LatLng(
  dataSet[i].latitude,
  dataSet[i].longitude
);

    // 마커를 생성합니다
    var marker = new kakao.maps.Marker({
      map: map, // 마커를 표시할 지도
      position: position, // 마커를 표시할 위치
    });

    markerArray.push(marker);

    // 마커에 표시할 인포윈도우를 생성합니다
    var infowindow = new kakao.maps.InfoWindow({
      content: getContent(dataSet[i]), // 인포윈도우에 표시할 내용
      disableAutoPan: true, // 인포윈도우를 열 때 지도가 자동으로 패닝하지 않을지의 여부 (기본값: false)
    });

    infowindowArray.push(infowindow);

    // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
    // 이벤트 리스너로는 클로저를 만들어 등록합니다
    // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
    kakao.maps.event.addListener(
      marker,
      "click",
      makeOverListener(map, marker, infowindow, position)
    );
    // 커스텀: 맵을 클릭하면 현재 나타난 인포윈도우가 없어지게끔
    kakao.maps.event.addListener(map, "click", makeOutListener(infowindow));
  }
}

//

const categoryList = document.querySelector(".category-list");

categoryList.addEventListener("click", categoryHandler);

// 카테고리
const categoryMap = {
  korea: "한식",
  china: "중식",
  japan: "일식",
  america: "양식",
  cafe: "카페",
  Overseas: "해외음식",
};

// 카테고리 클릭 핸들러
function categoryHandler(event) {
  const categoryId = event.target.id;
  const category = categoryMap[categoryId];

  if (!category) return;

  const categorizedDataSet = dataSet.filter((data) => {
  if (category === "카페,디저트") {
    return data.category === "카페" || data.category === "디저트";
  }

  return data.category === category;
});

  console.log(categorizedDataSet);

  closeMarker();
  closeInfowindow();

  restaurantMarkerList = [];

  setMap(categorizedDataSet);
}


function tagFilter(tagName) {

  const filteredData = dataSet.filter((data) => {
    return data.tag === tagName;
  });

  closeMarker();
  closeInfowindow();

  restaurantMarkerList = [];

  setMap(filteredData);
}
// 기존 마커 삭제 함수


// 기존 마커 삭제 함수
function closeMarker() {
  for (let i = 0; i < markerArray.length; i++) {
    markerArray[i].setMap(null);
  }

  markerArray = [];
}

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResultList = document.getElementById("searchResultList");

searchBtn.addEventListener("click", searchRestaurant);

searchInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    searchRestaurant();
  }
});

function searchRestaurant() {
  const keyword = searchInput.value.trim();

  searchResultList.innerHTML = "";

  if (keyword === "") {
    return;
  }

  const results = dataSet.filter(data =>
  data.title.includes(keyword)
);

  if (results.length === 0) {
    searchResultList.innerHTML = `
      <div class="search-empty">
        검색 결과가 없습니다.
      </div>
    `;
    return;
  }

  results.forEach(data => {
  const div = document.createElement("div");
  div.className = "search-result-card";

  div.innerHTML = `
    <div class="search-result-title">
      📍 ${data.title}
    </div>

    <div class="search-result-category">
      ${data.category}
    </div>

    <div class="search-result-address">
      ${data.address}
    </div>
  `;

  div.addEventListener("click", () => {
    closeMarker();
    closeInfowindow();

    restaurantMarkerList = [];

    setMap([data]);

    const position = new kakao.maps.LatLng(
      data.latitude,
      data.longitude
    );

    map.panTo(position);
  });

  searchResultList.appendChild(div);
});

}

const openRequestModal = document.getElementById("openRequestModal");
const closeRequestModal = document.getElementById("closeRequestModal");
const requestModal = document.getElementById("requestModal");
const submitRequestBtn = document.getElementById("submitRequestBtn");

submitRequestBtn.addEventListener("click", async () => {
  const name = document.getElementById("requestName").value.trim();
  const category = document.getElementById("requestCategory").value;
  const place_url = document.getElementById("requestPlaceUrl").value.trim();
  const address = document.getElementById("requestAddress").value.trim();
  const requestMessage = document.getElementById("requestMessage");

  if (!name || !category || !place_url || !address) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  if (!address.includes("시") && !address.includes("구")) {
    alert("주소를 정확히 입력해주세요.");
    return;
  }

  try {
    const coords = await getCoordsByAddress(address);

    const response = await fetch("/restaurant-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        category,
        place_url,
        address,
        latitude: coords.latitude,
        longitude: coords.longitude
      })
    });

    const result = await response.json();

    if (!response.ok) {
      alert("제보 등록 실패");
      return;
    }

    requestMessage.textContent = "제보가 완료되었습니다. 관리자 승인 후 등록됩니다.";

    document.getElementById("requestName").value = "";
    document.getElementById("requestCategory").value = "";
    document.getElementById("requestPlaceUrl").value = "";
    document.getElementById("requestAddress").value = "";
  } catch (err) {
    alert(err);
  }
});

openRequestModal.onclick = () => {
  requestModal.style.display = "block";
};

closeRequestModal.onclick = () => {
  requestModal.style.display = "none";
};

const randomBtn = document.getElementById("randomBtn");
const randomModal = document.getElementById("randomModal");
const randomResult = document.getElementById("randomResult");
const closeRandomBtn = document.getElementById("closeRandomBtn");

randomBtn.onclick = async () => {
  const response = await fetch("/restaurants");
  const restaurants = await response.json();

  if (restaurants.length === 0) {
    alert("등록된 음식점이 없습니다.");
    return;
  }

  randomModal.style.display = "block";

  let count = 0;
  let restaurant;

  const roulette = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    restaurant = restaurants[randomIndex];

    randomResult.innerHTML = `
      <h2>🎲 룰렛 돌리는 중...</h2>
      <h3>${restaurant.name}</h3>
    `;

    count++;

    if (count >= 25) {
      clearInterval(roulette);

      randomResult.innerHTML = `
        <h3>${restaurant.name}</h3>
        <p>${restaurant.category}</p>
        <p>${restaurant.address}</p>
        <a href="${restaurant.place_url}" target="_blank">
          카카오맵 이동
        </a>
      `;
    }
  }, 100);
};

closeRandomBtn.onclick = () => {
  randomModal.style.display = "none";
};

soloTag.onclick = () => {
  tagFilter("혼밥");
};

dateTag.onclick = () => {
  tagFilter("데이트");
};

groupTag.onclick = () => {
  tagFilter("회식");
};

const allViewBtn = document.getElementById("allViewBtn");

allViewBtn.onclick = () => {
  isFavoriteView = false;

  closeMarker();
  closeInfowindow();
  restaurantMarkerList = [];
  setMap(dataSet);
  searchResultList.innerHTML = "";
};

const favoriteViewBtn = document.getElementById("favoriteViewBtn");

favoriteViewBtn.onclick = () => {
  isFavoriteView = true;

  const favoriteData = dataSet.filter(data => {
    return favoriteList.includes(data.id);
  });

  closeMarker();
  closeInfowindow();
  restaurantMarkerList = [];
  setMap(favoriteData);
  searchResultList.innerHTML = "";
};

console.log("randomBtn:", randomBtn);
console.log("openRequestModal:", openRequestModal);
console.log("randomModal:", randomModal);
console.log("requestModal:", requestModal);
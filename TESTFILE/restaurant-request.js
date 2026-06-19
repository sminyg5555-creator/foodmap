const requestBtn = document.getElementById("requestBtn");
const geocoder = new kakao.maps.services.Geocoder();

function getCoordsByAddress(address) {
  return new Promise((resolve, reject) => {
    geocoder.addressSearch(address, function (result, status) {
      if (status === kakao.maps.services.Status.OK) {
        resolve({
          latitude: result[0].y,
          longitude: result[0].x
        });
      } else {
        reject("주소를 찾을 수 없습니다.");
      }
    });
  });
}

requestBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;
  const place_url = document.getElementById("place_url").value;
  const address = document.getElementById("address").value;
  const tag = document.getElementById("tag").value;
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
          tag,
          latitude: coords.latitude,
          longitude: coords.longitude,
      })
    });

    const result = await response.json();

    alert(result.message);
  } catch (error) {
    alert(error);
  }
});
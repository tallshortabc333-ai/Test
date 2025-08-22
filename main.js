// 讀取 JSON 檔案
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const list = document.getElementById('data-list');
    data.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name}, ${item.age} 歲, 職業: ${item.job}`;
      list.appendChild(li);
    });
  })
  .catch(error => console.error('讀取 JSON 錯誤:', error));

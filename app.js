let foodList = [];

const messageEl = document.getElementById('message');
const drawBtn = document.getElementById('drawBtn');
const resultDisplay = document.getElementById('resultDisplay');
const foodInput = document.getElementById('foodInput');
const addBtn = document.getElementById('addBtn');
const foodListEl = document.getElementById('foodList');

function loadFoodList() {
    const saved = localStorage.getItem('foodList');
    if (saved) {
        foodList = JSON.parse(saved);
    }
    renderFoodList();
}

function saveFoodList() {
    localStorage.setItem('foodList', JSON.stringify(foodList));
}

function renderFoodList() {
    foodListEl.innerHTML = '';
    foodList.forEach((food, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${food}</span>
            <button onclick="removeFood(${index})">删除</button>
        `;
        foodListEl.appendChild(li);
    });
}

function addFood() {
    const food = foodInput.value.trim();
    if (food && !foodList.includes(food)) {
        foodList.push(food);
        saveFoodList();
        renderFoodList();
        foodInput.value = '';
    }
}

function removeFood(index) {
    foodList.splice(index, 1);
    saveFoodList();
    renderFoodList();
}

async function getWelcomeMessage() {
    try {
        const response = await fetch('/api/welcome');
        const data = await response.json();
        messageEl.textContent = data.message;
        drawBtn.style.display = 'inline-block';
    } catch (error) {
        messageEl.textContent = '哎呀，小精灵迷路了... 请刷新页面试试~';
        console.error(error);
    }
}

async function drawFood() {
    if (foodList.length === 0) {
        messageEl.textContent = '食物库空空如也，先添加一些食物吧~';
        return;
    }

    const randomIndex = Math.floor(Math.random() * foodList.length);
    const selectedFood = foodList[randomIndex];

    messageEl.textContent = '正在施展美食魔法...';
    resultDisplay.textContent = '';

    try {
        const response = await fetch('/api/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ food: selectedFood })
        });
        const data = await response.json();
        messageEl.textContent = data.comment;
        resultDisplay.textContent = `🎉 今天就吃：${selectedFood}`;
    } catch (error) {
        messageEl.textContent = '魔法失灵了... 不过今天就吃：';
        resultDisplay.textContent = `🎉 ${selectedFood}`;
        console.error(error);
    }
}

addBtn.addEventListener('click', addFood);
foodInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addFood();
    }
});
drawBtn.addEventListener('click', drawFood);

loadFoodList();
getWelcomeMessage();

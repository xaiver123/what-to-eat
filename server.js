require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 提供静态文件 - 关键修复！
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/app.js', express.static(path.join(__dirname, 'app.js')));
app.use('/sprite.svg', express.static(path.join(__dirname, 'sprite.svg')));
app.use('/index.html', express.static(path.join(__dirname, 'index.html')));

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const API_KEY = process.env.DEEPSEEK_API_KEY;

async function callDeepSeek(messages) {
  try {
    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.response?.data || error.message);
    throw new Error('API 调用失败');
  }
}

app.get('/api/welcome', async (req, res) => {
  try {
    const messages = [
      {
        role: 'system',
        content: '你是一个贪吃的魔法小精灵，语气可爱活泼'
      },
      {
        role: 'user',
        content: '请说一句简短的欢迎语，欢迎用户来玩"今天吃什么"'
      }
    ];
    const welcomeMessage = await callDeepSeek(messages);
    res.json({ message: welcomeMessage });
  } catch (error) {
    res.status(500).json({ error: '获取欢迎语失败' });
  }
});

app.post('/api/comment', async (req, res) => {
  try {
    const { food } = req.body;
    if (!food) {
      return res.status(400).json({ error: '缺少食物名称' });
    }
    const messages = [
      {
        role: 'system',
        content: '你是一个贪吃的魔法小精灵，语气可爱活泼'
      },
      {
        role: 'user',
        content: `用户今天决定吃【${food}】，请你以可爱小精灵的语气，对这个食物做一句有趣的评价或描述，字数不超过50字`
      }
    ];
    const comment = await callDeepSeek(messages);
    res.json({ comment });
  } catch (error) {
    res.status(500).json({ error: '获取评价失败' });
  }
});

// 让所有路由都先尝试返回静态文件或 API
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 只有在非 Vercel 环境下才启动监听
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

// Vercel serverless 兼容
module.exports = app;

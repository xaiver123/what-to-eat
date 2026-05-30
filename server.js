require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const API_KEY = process.env.DEEPSEEK_API_KEY;

const SYSTEM_PROMPTS = {
  lingzhu: '你是一个名叫"灵珠"的美食小精灵。你性格温和、善良、可爱、乖巧、充满正能量。你的语气像个小天使，总是温柔地鼓励人。',
  mowan: '你是一个名叫"魔丸"的美食小精灵。你性格叛逆、暴躁、傲娇、毒舌、喜欢吐槽，但内心其实不坏。你的语气很不耐烦，拽拽的，喜欢用"切"、"小爷"之类的词。'
};

const USER_PROMPTS = {
  lingzhu: (food) => `用户今天决定吃【${food}】，请你以灵珠的语气，温柔地夸奖或描述这个食物，字数不超过50字。`,
  mowan: (food) => `用户今天决定吃【${food}】，请你以魔丸的傲娇毒舌语气，狠狠吐槽或别扭地评价这个食物，字数不超过50字。`
};

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
    const persona = req.query.persona || 'lingzhu';
    const systemPrompt = SYSTEM_PROMPTS[persona] || SYSTEM_PROMPTS.lingzhu;
    
    const welcomeText = persona === 'lingzhu' 
      ? '请说一句简短的欢迎语，欢迎用户来玩"今天吃什么"'
      : '请说一句简短的欢迎语，欢迎用户来玩"今天吃什么"，用魔丸傲娇的语气';
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: welcomeText }
    ];
    
    const welcomeMessage = await callDeepSeek(messages);
    res.json({ message: welcomeMessage });
  } catch (error) {
    res.status(500).json({ error: '获取欢迎语失败' });
  }
});

app.post('/api/comment', async (req, res) => {
  try {
    const { food, persona = 'lingzhu' } = req.body;
    if (!food) {
      return res.status(400).json({ error: '缺少食物名称' });
    }
    
    const systemPrompt = SYSTEM_PROMPTS[persona] || SYSTEM_PROMPTS.lingzhu;
    const userPrompt = (USER_PROMPTS[persona] || USER_PROMPTS.lingzhu)(food);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const comment = await callDeepSeek(messages);
    res.json({ comment });
  } catch (error) {
    res.status(500).json({ error: '获取评价失败' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

module.exports = app;
